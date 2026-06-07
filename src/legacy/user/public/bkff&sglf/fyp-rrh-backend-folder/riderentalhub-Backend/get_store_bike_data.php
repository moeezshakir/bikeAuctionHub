<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');

// Handle GET request to fetch store data with bike details
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Check if store_id parameter exists in GET request
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Store ID parameter is missing']);
            exit;
        }

        $storeId = $_GET['id'];

        // Fetch store details with bike data for the specified store ID
        $stmt = $pdo->prepare("
            SELECT rs.storeName, rs.location, bd.id AS bikeId, bd.type, bd.imageUrl, bd.pricePerHour, bd.bikeBookingStatus
            FROM rental_stores rs
            LEFT JOIN bikes_data bd ON rs._id = bd.store_id
            WHERE rs._id = :store_id
            ORDER BY bd.id
        ");
        $stmt->bindParam(':store_id', $storeId, PDO::PARAM_INT);
        $stmt->execute();

        // Initialize variables to store result
        $store = null;
        $bikes = [];

        // Fetch store details and bikes data
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!$store) {
                // Fetch store details only once
                $store = [
                    'storeName' => $row['storeName'],
                    'location' => json_decode($row['location'], true)
                ];
            }

            // Add bike details to the array
            if ($row['bikeId']) {
                $bikes[] = [
                    'id' => $row['bikeId'],
                    'type' => $row['type'],
                    'imageUrl' => $row['imageUrl'],
                    'pricePerHour' => floatval($row['pricePerHour']),
                    'bikeBookingStatus' => $row['bikeBookingStatus']
                ];
            }
        }

        // Prepare response
        if ($store) {
            $response = [
                'status' => true,
                'data' => [
                    'store' => $store,
                    'bikes' => $bikes
                ]
            ];
        } else {
            $response = [
                'status' => false,
                'error' => 'Store not found or no bikes available'
            ];
        }
    } catch (PDOException $e) {
        // Log PDO exceptions for debugging
        error_log('PDOException: ' . $e->getMessage());
        $response = [
            'status' => false,
            'error' => 'Database error'
        ];
    } catch (Exception $e) {
        // Log other exceptions for debugging
        error_log('Exception: ' . $e->getMessage());
        $response = [
            'status' => false,
            'error' => 'An unexpected error occurred'
        ];
    }

    // Send JSON response
    echo json_encode($response);
    exit; // Ensure script terminates after sending response
}
