

app = Flask(__name__)


with app.app_context():
    create_tables()


signedinusers = {}
active_websockets = {}



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

    user = database_helper.check_user(email=email, password=password)
    if not user["success"]:
        return jsonify({"error": "User not found or invalid username or invalid password"}), 401

    min_password_length = 6
    if len(password) < min_password_length:
        return jsonify({"success": False, "error": "Password minimum length should be 6"}), 422

    if email in signedinusers:
        return jsonify({"success": False, "error": "User is already logged in"}), 409

    access_token = "".join(random.choices(
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', k=32))
    database_helper.store_token(email, access_token)

    signedinusers[email] = access_token

    if email not in active_websockets:
        ws = request.environ.get("wsgi.websocket")
        if ws:
            active_websockets[email] = ws

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
        return jsonify({"error": "Some of the data is missing"}), 400

    min_password_length = 6
    if len(password) < min_password_length:
        return jsonify({"error": "The password has to have at least 6 characters"}), 422

    if "@" not in email:
        return jsonify({"error": "Pls check the email format"}), 422

    status_code, message = database_helper.save_user(
        email, password, firstname, familyname, gender, city, country)

    return jsonify({"message": message}), status_code


@app.route("/sign_out", methods=["get"])
def sign_out():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Token is missing"}), 400

    token_data = database_helper.get_token_data(token)

    if not token_data:
        return jsonify({"error": "Token not there or invalid"}), 401

    result = database_helper.invalidate_token(token_data["access_token"])

    if not result:
        return jsonify({"error": "Token not there or invalid"}), 401

    email = token_data["email"]
    if email in signedinusers:
        del signedinusers[email]

    if email in active_websockets:
        try:
            active_websockets[email].close()
        except WebSocketError:
            pass
        del active_websockets[email]

    return jsonify({"message": "User is now signed out"}), 200


@app.route("/change_password", methods=["PUT"])
def change_password():
    data = request.get_json()
    token = request.headers.get("Authorization")

    if "oldpassword" not in data or "newpassword" not in data:
        return jsonify({"error": "Either old password or new password is missing"}), 400

    oldpassword = data["oldpassword"]
    newpassword = data["newpassword"]

    token_data = database_helper.get_token_data(token)
    if token_data is None:
        return jsonify({"message": "Token is not there or invalid"}), 401

    email_data = database_helper.get_email_data(token_data["access_token"])
    if email_data is None:
        return jsonify({"message": "User can not be located"}), 401

    user_data = database_helper.check_user(email_data["email"], oldpassword)
    if not user_data.get("success"):
        return jsonify({"message": "Old password is incorrect"}), 401

    if len(newpassword) < 6:
        return jsonify({"message": "New password must be at least 6 characters long"}), 422

    status, message = database_helper.update_password(
        email_data["email"], newpassword)
    if status != 200:
        return jsonify({"message": message}), status

    return jsonify({"message": "You now have a new password :)"})


@app.route("/get_user_data_by_token", methods=["get"])
def get_user_data_by_token():
    token = request.headers.get("Authorization")

    token_data = database_helper.get_token_data(token)
    if token_data is None:
        return jsonify({"message": "Token is not threre or invalid"}), 401

    email_data = database_helper.get_email_data(token_data["access_token"])
    if email_data is None:
        return jsonify({"message": "User can not be located"}), 404

    response_data = {
        "email": email_data["email"],
        "firstname": email_data["firstname"],
        "familyname": email_data["familyname"],
        "gender": email_data["gender"],
        "city": email_data["city"],
        "country": email_data["country"]
    }

    return jsonify(response_data), 200


@app.route("/get_user_data_by_email/<email>", methods=["GET"])
def get_user_data_by_email(email):
    token = request.headers.get("Authorization")

    token_data = database_helper.get_token_data(token)
    if token_data is None:
        return jsonify({"message": "Token is invalid or not there"}), 401

    email_data = database_helper.get_email_email_data(email)
    if email_data is None:
        return jsonify({"message": "User cannot be located"}), 404

    response_data = {
        "email": email_data["email"],
        "firstname": email_data["firstname"],
        "familyname": email_data["familyname"],
        "gender": email_data["gender"],
        "city": email_data["city"],
        "country": email_data["country"]
    }

    return jsonify({"success": True, "data": response_data, "message": "User data retrieved successfully"}), 200


@app.route("/post_message", methods=["post"])
def post_message():
    data = request.get_json()
    token = request.headers.get("Authorization")
    if "message" not in data or "email" not in data:
        return jsonify({"message": "Message or email is missing"}), 400
    message = data["message"]
    email = data["email"]

    token_data = database_helper.get_token_data(token)
    if token_data is None:
        return jsonify({"message": "Token not there or invalid"}), 401

    email_data = database_helper.get_email_data(token_data["access_token"])
    if email_data is None:
        return jsonify({"message": "User can not be found"}), 404

    recipient_data = database_helper.get_email_email_data(email)
    if recipient_data is None:
        return jsonify({"message": "Message recipient can not be found"}), 404

    database_helper.save_message(
        email_data["email"], recipient_data["email"], message)
    return jsonify({"message": "Message is posted"}), 200


@app.route("/get_user_messages_by_token", methods=["GET"])
def get_user_messages_by_token():
    token = request.headers.get("Authorization")

    token_data = database_helper.get_token_data(token)
    if token_data is None:
        return jsonify({"message": "Token not found or invalid"}), 401

    email = token_data["email"]
    messages = database_helper.get_messages_by_email(email)
    return jsonify({"messages": messages}), 200


@app.route("/get_user_messages_by_email/<email>", methods=["get"])
def get_user_messages_by_email(email):
    token = request.headers.get("Authorization")

    token_data = database_helper.get_token_data(token)
    if token_data is None:
        return jsonify({"message": "Token not there or invalid"}), 401

    user_data = database_helper.get_user_data_by_email(email)
    if user_data is None:
        return jsonify({"message": "User can not be located"}), 404

    messages = database_helper.get_messages_by_email(email)

    return jsonify({"messages": messages}), 200

@app.route("/websocket")
def websocket():
    ws = request.environ.get("wsgi.websocket")
    if not ws:
        return jsonify({"error": "WebSocket connection failed"}), 400

    # Get the user's access token from the query string
    access_token = request.args.get("access_token")
    if not access_token:
        return jsonify({"error": "Access token is missing"}), 400

    # Get the user's email address associated with the access token
    token_data = database_helper.get_token_data(access_token)
    if not token_data:
        return jsonify({"error": "Invalid access token"}), 401

    email = token_data["email"]

    # Check if the user is signed in and the websocket is not already active
    if email not in signedinusers or email in active_websockets:
        return jsonify({"error": "User is not signed in or websocket is already active"}), 403

    # Add the websocket to the active websockets dictionary
    active_websockets[email] = ws

    # WebSocket message loop
    while not ws.closed:
        try:
            # Send a message to the client every 10 seconds
            ws.send("Hello from server!")
            gevent.sleep(10)
        except WebSocketError:
            break

    # Remove the websocket from the active websockets dictionary when it's closed
    if email in active_websockets:
        del active_websockets[email]

    return "", 200



if __name__ == "__main__":
    http_server = WSGIServer(("0.0.0.0", 5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
