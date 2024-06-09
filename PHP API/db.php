<?php
$host = "IP:PORT";
$username = "USERNAME";
$password = "PASSWORD";
$database = "DATABASE";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
