import gevent
import random
import database_helper
from flask import Flask, jsonify, request
from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketError
from geventwebsocket.handler import WebSocketHandler

app = Flask(__name__)

with app.app_context():
    database_helper.create_tables()

signedinusers = {}
websocketsss = {}

@app.route("/", methods=["get"])
def root():
    return app.send_static_file("client.html"), 200

@app.route("/sign_in", methods=["post"])
def sign_in():
    data = request.get_json()
    if "email" not in data or "password" not in data:
        return jsonify({"error": "You have to have an email and a password"}), 400
    email = data["email"]
    password = data["password"]
    user = database_helper.check_user(email, password)
    if not user["success"]:
        return jsonify({"error": "Invalid username or invalid password"}), 401
    passwordlength = 6
    if len(password) < passwordlength:
        return jsonify({"success": False, "error": "Password minimum length should be 6"}), 422
    if email in signedinusers:
        return jsonify({"success": False, "error": "User is already logged in"}), 409
    access_token = "".join(random.choices(
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", k=32))
    database_helper.store_token(email, access_token)
    signedinusers[email] = access_token
    if email not in websocketsss:
        ws = request.environ.get("wsgi.websocket")
        if ws:
            websocketsss[email] = ws
    return jsonify({"success": True, "message": "User is now signed in", "access_token": access_token}), 200

@app.route("/sign_up", methods=["post"])
def sign_up():
    data = request.get_json()
    if "email" not in data or "password" not in data or "firstname" not in data or "familyname" not in data or "gender" not in data or "city" not in data or "country" not in data:
        return jsonify({"error": "One of the needed parameters is missing"}), 400
    email = data["email"]
    password = data["password"]
    firstname = data["firstname"]
    familyname = data["familyname"]
    gender = data["gender"]
    city = data["city"]
    country = data["country"]
    if not all([email, password, firstname, familyname, gender, city, country]):
        return jsonify({"message": "Some of the data is missing"}), 400
    passwordlength = 6
    if len(password) < passwordlength:
        return jsonify({"message": "The password has to have at least 6 characters"}), 422
    if "@" not in email:
        return jsonify({"message": "Pls check the email format"}), 422
    status_code, message = database_helper.save_user(
        email, password, firstname, familyname, gender, city, country)
    return jsonify({"message": message}), status_code

@app.route("/sign_out", methods=["get"])
def sign_out():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"message": "Token is missing"}), 400
    tokendata = database_helper.get_token_data(token)
    if not tokendata:
        return jsonify({"message": "Token not there or invalid"}), 401
    result = database_helper.invalidate_token(tokendata["access_token"])
    if not result:
        return jsonify({"message": "Token not there or invalid"}), 401
    email = tokendata["email"]
    if email in signedinusers:
        del signedinusers[email]
    if email in websocketsss:
        try:
            websocketsss[email].close()
        except WebSocketError:
            pass
        del websocketsss[email]
    return jsonify({"message": "User is now signed out"}), 200


# Change this one for real!!!!!!!!
@app.route("/change_password", methods=["put"])
def change_password():
    data = request.get_json()
    token = request.headers.get("Authorization")
    if "oldpassword" not in data or "newpassword" not in data:
        return jsonify({"message": "Either old password or new password is missing"}), 400
    oldpassword = data["oldpassword"]
    newpassword = data["newpassword"]
    tokendata = database_helper.get_token_data(token)
    if tokendata is None:
        return jsonify({"message": "Token is not there or invalid"}), 401
    emaildata = database_helper.get_email_data(tokendata["access_token"])
    if emaildata is None:
        return jsonify({"message": "User can not be located"}), 401
    userdata = database_helper.check_user(emaildata["email"], oldpassword)
    if not userdata.get("success"):
        return jsonify({"message": "Old password is incorrect"}), 401
    if len(newpassword) < 6:
        return jsonify({"message": "New password must be at least 6 characters long"}), 422
    status, message = database_helper.update_password(
        emaildata["email"], newpassword)
    if status != 200:
        return jsonify({"message": message}), status
    return jsonify({"message": "You now have a new password :)"})

@app.route("/get_user_data_by_token", methods=["get"])
def get_user_data_by_token():
    token = request.headers.get("Authorization")
    tokendata = database_helper.get_token_data(token)
    if tokendata is None:
        return jsonify({"message": "Token is not threre or invalid"}), 401
    emaildata = database_helper.get_email_data(tokendata["access_token"])
    if emaildata is None:
        return jsonify({"message": "User can not be located"}), 404
    responsedata = {
        "email": emaildata["email"],
        "firstname": emaildata["firstname"],
        "familyname": emaildata["familyname"],
        "gender": emaildata["gender"],
        "city": emaildata["city"],
        "country": emaildata["country"]
    }
    return jsonify(responsedata), 200

@app.route("/get_user_data_by_email/<email>", methods=["get"])
def get_user_data_by_email(email):
    token = request.headers.get("Authorization")
    tokendata = database_helper.get_token_data(token)
    if tokendata is None:
        return jsonify({"message": "Token is invalid or not there"}), 401
    emaildata = database_helper.get_email_email_data(email)
    if emaildata is None:
        return jsonify({"message": "User cannot be located"}), 404
    responsedata = {
        "email": emaildata["email"],
        "firstname": emaildata["firstname"],
        "familyname": emaildata["familyname"],
        "gender": emaildata["gender"],
        "city": emaildata["city"],
        "country": emaildata["country"]
    }
    return jsonify({"success": True, "data": responsedata, "message": "User data retrieved successfully"}), 200

@app.route("/post_message", methods=["post"])
def post_message():
    data = request.get_json()
    token = request.headers.get("Authorization")
    if "message" not in data or "email" not in data:
        return jsonify({"message": "Message or email is missing"}), 400
    message = data["message"]
    email = data["email"]
    tokendata = database_helper.get_token_data(token)
    if tokendata is None:
        return jsonify({"message": "Token not there or invalid"}), 401
    emaildata = database_helper.get_email_data(tokendata["access_token"])
    if emaildata is None:
        return jsonify({"message": "User can not be found"}), 404
    recipientdata = database_helper.get_email_email_data(email)
    if recipientdata is None:
        return jsonify({"message": "Message recipient can not be found"}), 404
    database_helper.save_message(
        emaildata["email"], recipientdata["email"], message)
    return jsonify({"message": "Message is posted"}), 200

@app.route("/get_user_messages_by_token", methods=["get"])
def get_user_messages_by_token():
    token = request.headers.get("Authorization")
    tokendata = database_helper.get_token_data(token)
    if tokendata is None:
        return jsonify({"message": "Token not found or invalid"}), 401
    email = tokendata["email"]
    messages = database_helper.get_messages_by_email(email)
    return jsonify({"messages": messages}), 200

@app.route("/get_user_messages_by_email/<email>", methods=["get"])
def get_user_messages_by_email(email):
    token = request.headers.get("Authorization")
    tokendata = database_helper.get_token_data(token)
    if tokendata is None:
        return jsonify({"message": "Token not there or invalid"}), 401
    userdata = database_helper.get_user_data_by_email(email)
    if userdata is None:
        return jsonify({"message": "User can not be located"}), 404
    messages = database_helper.get_messages_by_email(email)
    return jsonify({"messages": messages}), 200

@app.route("/recover_password", methods=["post"])
def recover_password():
    data = request.get_json()
    email = data["email"]
    userdata = database_helper.get_email_email_data(email)
    if userdata:
        newpassword = database_helper.generate_password()
        status, message = database_helper.update_password(email, newpassword)
        if status == 200:
            database_helper.send_password_email(email, newpassword)
            return jsonify({"message": "Password recovery email sent."}), 200
        else:
            return jsonify({"message": message}), status
    else:
        return jsonify({"message": "Email address not found."}), 404


#also care here 
@app.route("/websocket")
def websocket():
    ws = request.environ.get("wsgi.websocket")
    if not ws:
        return jsonify({"error": "WebSocket connection failed"}), 400
    access_token = request.args.get("access_token")
    if not access_token:
        return jsonify({"error": "Token  is missing"}), 400
    tokendata = database_helper.get_token_data(access_token)
    if not tokendata:
        return jsonify({"error": "Invalid access token"}), 401
    email = tokendata["email"]
    if email not in signedinusers or email in websocketsss:
        return jsonify({"error": "User is not signed in or websocket is already active"}), 403
    websocketsss[email] = ws
    if email in websocketsss:
        del websocketsss[email]
    return "", 200

if __name__ == "__main__":
    http_server = WSGIServer(("0.0.0.0", 2001), app,
                             handler_class=WebSocketHandler)
    http_server.serve_forever()
