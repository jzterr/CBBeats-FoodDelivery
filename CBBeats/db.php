<?php
// db.php - Database connection file

$servername = "localhost";    // usually "localhost" for local development
$username   = "root";         // your database username
$password   = "";             // your database password (often empty for local setups)
$database   = "cbbeats"; // change to your actual database name

// Create a new MySQLi connection
$conn = new mysqli($servername, $username, $password, $database);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
    
}

// Optionally, set the charset (recommended for proper encoding)
$conn->set_charset("utf8");

// Now you can use the $conn variable in your scripts.
?>
