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

// Handle POST request to insert or update ride places
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $postData = json_decode(file_get_contents("php://input"), true);

    if (!isset($postData['store_id'])) {
        http_response_code(400);
        echo json_encode(['status' => false, 'error' => 'Missing store_id']);
        exit;
    }

    $store_id = $postData['store_id'];
    $locations = [
        'location_1' => $postData['location_1'] ?? null,
        'location_2' => $postData['location_2'] ?? null,
        'location_3' => $postData['location_3'] ?? null,
        'location_4' => $postData['location_4'] ?? null,
        'location_5' => $postData['location_5'] ?? null,
        'location_6' => $postData['location_6'] ?? null,
        'location_7' => $postData['location_7'] ?? null,
        'location_8' => $postData['location_8'] ?? null,
    ];

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Check if store_id exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM ride_places WHERE store_id = ?");
        $stmt->execute([$store_id]);
        $count = $stmt->fetchColumn();

        if ($count > 0) {
            // Update existing record
            $stmt = $pdo->prepare("
                UPDATE ride_places
                SET location_1 = ?, location_2 = ?, location_3 = ?, location_4 = ?, 
                    location_5 = ?, location_6 = ?, location_7 = ?, location_8 = ?
                WHERE store_id = ?
            ");
            $result = $stmt->execute([
                $locations['location_1'], $locations['location_2'], $locations['location_3'], $locations['location_4'],
                $locations['location_5'], $locations['location_6'], $locations['location_7'], $locations['location_8'],
                $store_id
            ]);

            if ($result) {
                echo json_encode(['status' => true, 'message' => 'Ride places updated successfully']);
            } else {
                throw new Exception('Failed to update ride places');
            }
        } else {
            // Insert new record
            $stmt = $pdo->prepare("
                INSERT INTO ride_places (store_id, location_1, location_2, location_3, location_4, 
                                         location_5, location_6, location_7, location_8)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $result = $stmt->execute([
                $store_id, $locations['location_1'], $locations['location_2'], $locations['location_3'], $locations['location_4'],
                $locations['location_5'], $locations['location_6'], $locations['location_7'], $locations['location_8']
            ]);

            if ($result) {
                echo json_encode(['status' => true, 'message' => 'Ride places inserted successfully']);
            } else {
                throw new Exception('Failed to insert ride places');
            }
        }
    } catch (PDOException $e) {
        error_log('PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'Database error occurred']);
    } catch (Exception $e) {
        error_log('Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'An unexpected error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => false, 'error' => 'Method not allowed']);
}
