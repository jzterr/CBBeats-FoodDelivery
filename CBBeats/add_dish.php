<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'db.php'; // Adjust the path if needed

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get dish details from POST data
    $dishName = isset($_POST['dishName']) ? trim($_POST['dishName']) : '';
    $dishPrice = isset($_POST['dishPrice']) ? trim($_POST['dishPrice']) : '';

    // Check if file was uploaded
    if (!isset($_FILES['dishImage']) || $_FILES['dishImage']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["status" => "error", "message" => "Image file is required."]);
        exit;
    }

    // Validate required fields
    if (empty($dishName) || empty($dishPrice)) {
        echo json_encode(["status" => "error", "message" => "All fields are required."]);
        exit;
    }

    // Read the uploaded image file content (binary data)
    $imageData = file_get_contents($_FILES['dishImage']['tmp_name']);

    // Prepare the SQL statement with blob parameter.
    // Use "sdb" - string, double, blob.
    $stmt = $conn->prepare("INSERT INTO dishes (name, price, image) VALUES (?, ?, ?)");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
        exit;
    }
    
    // For blobs, we bind a null variable first and then send the long data.
    $null = NULL;
    $stmt->bind_param("sdb", $dishName, $dishPrice, $null);
    // Parameter index is zero-based; here the blob is the third parameter (index 2)
    $stmt->send_long_data(2, $imageData);

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "success", 
            "message" => "Dish added successfully.",
            "dish" => [
                "id"    => $stmt->insert_id,
                "name"  => $dishName,
                "price" => $dishPrice,
                // Note: If you want to display the image later, you may need to base64 encode it:
                "image" => base64_encode($imageData)
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to add dish."]);
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
