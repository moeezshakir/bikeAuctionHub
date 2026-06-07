<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $postData = json_decode(file_get_contents("php://input"), true);

    try {
        // Assuming you receive storeId and bikeId from the frontend
        $storeId = $postData['storeId'];
        $bikeId = $postData['bikeId'];

        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Begin a transaction
        $pdo->beginTransaction();

        try {
            // Prepare SQL statement for deleting bike data
            $stmt = $pdo->prepare("
                DELETE FROM bikes_data
                WHERE store_id = ? AND id = ?
            ");

            // Execute the statement with provided data
            $stmt->execute([$storeId, $bikeId]);

            // Check if any row was affected
            if ($stmt->rowCount() > 0) {
                // Update rental_stores table: decrease bikeleft by 1
                $updateStoreStmt = $pdo->prepare("UPDATE rental_stores SET bikeleft = bikeleft - 1 WHERE _id = ?");
                $updateStoreStmt->execute([$storeId]);

                // Commit the transaction
                $pdo->commit();

                echo json_encode(['status' => true, 'message' => 'Bike deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['status' => false, 'error' => 'Bike not found']);
            }
        } catch (PDOException $e) {
            // Rollback the transaction on failure
            $pdo->rollBack();
            throw $e;
        }
    } catch (PDOException $e) {
        error_log('PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'Failed to delete bike']);
    } catch (Exception $e) {
        error_log('Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'An unexpected error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => false, 'error' => 'Method not allowed']);
}
