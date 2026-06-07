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

// Handle GET request to fetch store data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Fetch all store details from rental_stores table
        $storeStmt = $pdo->prepare("SELECT * FROM rental_stores");
        $storeStmt->execute();
        $stores = $storeStmt->fetchAll(PDO::FETCH_ASSOC);

        if ($stores) {
            // Prepare store data
            $storeData = array_map(function ($store) {
                return [
                    '_id' => $store['_id'],
                    'location' => json_decode($store['location'], true),
                    'image' => $store['image'],
                    'bikeleft' => $store['bikeleft'],
                    'types_of_bike' => json_decode($store['types_of_bike'], true),
                    'status' => $store['status'],
                    'storeName' => $store['storeName']
                ];
            }, $stores);

            $response = [
                'status' => true,
                'data' => $storeData
            ];
        } else {
            // No stores found
            $response = [
                'status' => false,
                'error' => 'No stores found'
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
