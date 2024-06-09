<?php
include('db.php');

// ---------- Check if it's a GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['table'])) {
        $table = $_GET['table'];

        // Define a whitelist of allowed tables
        $allowedTables = array("Drivers", "Circuits", "Teams", "News", "ChatUsers", "ChatMessages", "Test");

        if (in_array($table, $allowedTables)) {
            // Handle the case when a "name" parameter is provided
            if (isset($_GET['name'])) {
                $name = $_GET['name'];
                $sql = "SELECT * FROM " . $table . " WHERE name = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("s", $name);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                // Handle the case when no "name" parameter is provided
                $sql = "SELECT * FROM " . $table;
                $result = $conn->query($sql);
            }

            if ($result) {
                $response = array();

                while ($row = $result->fetch_assoc()) {
                    $response[] = $row;
                }

                echo json_encode($response);
            } else {
                echo json_encode(array("error" => "Table not found or name not found"));
            }
        } else {
            echo json_encode(array("error" => "Invalid table name"));
        }
    } else {
        echo json_encode(array("error" => "Table parameter is missing"));
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') { // Check if it's a POST request
    
    if (strpos($_SERVER['REQUEST_URI'], '/addRecord') !== false) {  //addRecord
        $post_data = json_decode(file_get_contents('php://input'), true);
        
        if (preg_match('~\/addRecord\/([^\/]+)$~', $_SERVER['REQUEST_URI'], $matches)) {
            // Extract tableName using regex
            $tableName = $matches[1];
            
            // Check if tableName is allowed
            $allowedTables = array("Drivers", "Circuits", "Teams", "News", "ChatUsers", "ChatMessages", "Test");
            if (in_array($tableName, $allowedTables)) {
                
                // Construct SQL query
                $columns = implode(', ', array_keys($post_data));
                $placeholders = implode(', ', array_fill(0, count($post_data), '?'));
                $sql = "INSERT INTO $tableName ($columns) VALUES ($placeholders)";
                
                // Prepare and execute the SQL query
                $stmt = $conn->prepare($sql);
                $stmt->bind_param(str_repeat('s', count($post_data)), ...array_values($post_data));
                if ($stmt->execute()) {
                    echo json_encode(array("success" => "Data added successfully"));
                } else {
                    echo json_encode(array("error" => "Failed to add data to the table"));
                }
            } else {
                echo json_encode(array("error" => "Non Existing Table"));
            }
        } else {
            echo json_encode(array("error" => "Invalid endpoint"));
        }
        
    } else {    //NO /addRecord
        $post_data = json_decode(file_get_contents('php://input'), true);

        if (isset($post_data['table'])) {
            $table = $post_data['table'];

            // ---------- Handle ChatUsers table
            if ($table == 'ChatUsers') {
                if (isset($post_data['username'])) {
                    $username = $post_data['username'];
                    $sql = "INSERT INTO ChatUsers (Username) VALUES (?)";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("s", $username);

                    if ($stmt->execute()) {
                        $idChatUsers = $stmt->insert_id;
                        echo json_encode(array("success" => "User added successfully", "idChatUsers" => $idChatUsers));
                    } else {
                        echo json_encode(array("error" => "Failed to add user"));
                    }
                } else {
                    echo json_encode(array("error" => "Username parameter is missing"));
                }
            }

            // ---------- Handle ChatMessages table
            elseif ($table == 'ChatMessages') {
                if (isset($post_data['iduser'], $post_data['content'], $post_data['timestamp'])) {
                    $iduser = $post_data['iduser'];
                    $content = $post_data['content'];
                    $timestamp = $post_data['timestamp'];

                    $sql = "INSERT INTO ChatMessages (iduser, Content, Timestamp) VALUES (?, ?, ?)";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iss", $iduser, $content, $timestamp);

                    if ($stmt->execute()) {
                        echo json_encode(array("success" => "Message added successfully"));
                    } else {
                        echo json_encode(array("error" => "Failed to add message"));
                    }
                } else {
                    echo json_encode(array("error" => "Parameters (iduser, content, timestamp) are missing"));
                }
            } else {
                echo json_encode(array("error" => "Invalid table name or missing parameters"));
            }
        } else {
            echo json_encode(array("error" => "Invalid table name or missing parameters"));
        }
    }
    
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') { // Check if it's a DELETE request
    if (isset($_GET['table'], $_GET['idName'], $_GET['id'])) {
        $table = $_GET['table'];
        $idName = $_GET['idName'];
        $id = $_GET['id'];

        // Define a whitelist of allowed tables
        $allowedTables = array("Drivers", "Circuits", "Teams", "News", "ChatUsers", "ChatMessages", "Test");

        if (in_array($table, $allowedTables)) {
            $idColumnName = $idName;
            $sql = "DELETE FROM $table WHERE $idColumnName = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);

            if ($stmt->execute()) {
                echo json_encode(array("success" => "Record deleted successfully"));
            } else {
                echo json_encode(array("error" => "Failed to delete record"));
            }
        } else {
            echo json_encode(array("error" => "Invalid table name"));
        }
    } else {
        echo json_encode(array("error" => "Table parameter or id is missing"));
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') { // Check if it's a PUT request
    
    $put_data = json_decode(file_get_contents('php://input'), true);
    
    if (preg_match('~\/api\.php\/([^\/]+)\/([^\/]+)\/([^\/]+)$~', $_SERVER['REQUEST_URI'], $matches)) {
        // Extract tableName using regex
        $tableName = $matches[1];
        $rowName = $matches[2];
        $rowId = $matches[3];
        
        // Check if tableName is allowed
        $allowedTables = array("Drivers", "Circuits", "Teams", "News", "ChatUsers", "ChatMessages", "Test");
        if (in_array($tableName, $allowedTables)) {
            
            $setValues = [];
            foreach ($put_data as $key => $value) {
                $setValues[] = "`$key` = '$value'";
            }

            $setValuesQuery = implode(", ", $setValues);

            $sql = "UPDATE `" . $tableName . "` SET " . $setValuesQuery . " WHERE (`" . $rowName . "` = '" . $rowId . "')";

            $stmt = $conn->prepare($sql);
            
            if ($stmt->execute()) {
                echo json_encode(array("success" => "Record Edited successfully"));
            } else {
                echo json_encode(array("error" => "Failed to Edit record"));
            }
            
        } else {
            echo json_encode(array("error" => "Non Existing Table"));
        }
        
        
        
    } else {
        echo json_encode(array("error" => "Invalid Input"));
    }
    
    
    
    
} else {
    echo json_encode(array("error" => "Invalid request method"));
}
?>
