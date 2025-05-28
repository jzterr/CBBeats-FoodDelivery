<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Required fields
    $dishId    = isset($_POST['dishId']) ? intval($_POST['dishId']) : 0;
    $dishName  = isset($_POST['dishName']) ? trim($_POST['dishName']) : '';
    $dishPrice = isset($_POST['dishPrice']) ? trim($_POST['dishPrice']) : '';
    
    if ($dishId <= 0 || empty($dishName) || empty($dishPrice)) {
        echo json_encode(["status" => "error", "message" => "All fields are required."]);
        exit;
    }
    
    // Check if a new image file is uploaded
    $newImageUploaded = (isset($_FILES['dishImage']) && $_FILES['dishImage']['error'] === UPLOAD_ERR_OK);
    
    if ($newImageUploaded) {
        $imageData = file_get_contents($_FILES['dishImage']['tmp_name']);
        // Update including image
        $stmt = $conn->prepare("UPDATE dishes SET name = ?, price = ?, image = ? WHERE id = ?");
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
            exit;
        }
        $null = NULL;
        // Bind string, double, blob, int
        $stmt->bind_param("sdbi", $dishName, $dishPrice, $null, $dishId);
        $stmt->send_long_data(2, $imageData);
    } else {
        // Update without image
        $stmt = $conn->prepare("UPDATE dishes SET name = ?, price = ? WHERE id = ?");
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
            exit;
        }
        $stmt->bind_param("sdi", $dishName, $dishPrice, $dishId);
    }
    
    if ($stmt->execute()) {
        // If image updated, return base64 encoded image; else, fetch existing image
        if ($newImageUploaded) {
            $imageBase64 = base64_encode($imageData);
        } else {
            // Retrieve the current image from the database
            $res = $conn->query("SELECT image FROM dishes WHERE id = $dishId");
            $row = $res->fetch_assoc();
            $imageBase64 = base64_encode($row['image']);
        }
        echo json_encode([
            "status" => "success",
            "message" => "Dish updated successfully.",
            "dish" => [
                "id"    => $dishId,
                "name"  => $dishName,
                "price" => $dishPrice,
                "image" => $imageBase64
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update dish."]);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
