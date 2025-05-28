<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start(); // Start session at the top

require 'db.php'; // Ensure your database connection file is included

header('Content-Type: application/json'); // JSON response

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    // Detect content type and retrieve POST data accordingly
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (stripos($contentType, 'application/json') !== false) {
        // Receive the RAW post data.
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? trim($data['password']) : '';
        $role = isset($data['role']) ? trim($data['role']) : '';
    } else {
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $password = isset($_POST['password']) ? trim($_POST['password']) : '';
        $role = isset($_POST['role']) ? trim($_POST['role']) : '';
    }

    // Validate input fields
    if (empty($email) || empty($password) || empty($role)) {
        echo json_encode(["status" => "error", "message" => "All fields are required."]);
        exit;
    }

    // Ensure role is either 'admin' or 'customer'
    if ($role !== "admin" && $role !== "customer") {
        echo json_encode(["status" => "error", "message" => "Invalid user role."]);
        exit;
    }

    // Choose the table based on role
    $table = ($role === "admin") ? "admin_users" : "customers";

    $stmt = $conn->prepare("SELECT * FROM $table WHERE email = ?");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
        exit;
    }
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["status" => "error", "message" => "There is no existing account."]);
        exit;
    }

    $user = $result->fetch_assoc();

    // Process based on role
    if ($role === "admin") {
        // Plain text comparison (consider switching to password_hash() if possible)
        if ($password === $user['password']) {
            $_SESSION['admin_email'] = $email;
            $redirectUrl = "adminhomepage.php";
            echo json_encode(["status" => "success", "redirectUrl" => $redirectUrl]);
        } else {
            error_log("DEBUG: Password verification failed for email: $email. Input password: $password, Stored password: " . $user['password']);
            echo json_encode([
                "status" => "error", 
                "message" => "Wrong email or password.",
                "debug" => "Password verification failed"
            ]);
        }
    } else { // customer
        if (password_verify($password, $user['password'])) {
            $_SESSION['customer_email'] = $email;
            $redirectUrl = "customerhomepage.php";
            echo json_encode(["status" => "success", "redirectUrl" => $redirectUrl]);
        } else {
            echo json_encode(["status" => "error", "message" => "Wrong email or password."]);
        }
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
