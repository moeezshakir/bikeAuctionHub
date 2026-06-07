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

// Handle POST request to update user profile data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Validate required fields
    $requiredFields = ['user_id', 'name', 'phoneNumber', 'address', 'nationality', 'languages'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            echo json_encode([
                'status' => false,
                'error' => "Missing required field: $field"
            ]);
            exit;
        }
    }

    $user_id = $data['user_id'];
    $name = $data['name'];
    $phone_number = $data['phoneNumber'];
    $address = $data['address'];
    $nationality = $data['nationality'];
    $languages = $data['languages'];
    // $profile_pic = isset($data['image']) ? $data['image'] : null;

    // Social links data
    $facebook = isset($data['socialLinks']['facebook']) ? $data['socialLinks']['facebook'] : '';
    $instagram = isset($data['socialLinks']['instagram']) ? $data['socialLinks']['instagram'] : '';
    $linkedin = isset($data['socialLinks']['linkedin']) ? $data['socialLinks']['linkedin'] : '';
    $youtube = isset($data['socialLinks']['youtube']) ? $data['socialLinks']['youtube'] : '';

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Get the current email to ensure it doesn't change
        $getUserStmt = $pdo->prepare("SELECT email FROM rrh_user WHERE id = ?");
        $getUserStmt->execute([$user_id]);
        $currentUser = $getUserStmt->fetch(PDO::FETCH_ASSOC);

        if (!$currentUser) {
            echo json_encode([
                'status' => false,
                'error' => 'User not found'
            ]);
            exit;
        }

        $currentEmail = $currentUser['email'];

        // Update user details in rrh_user table, excluding email
        $updateUserStmt = $pdo->prepare("UPDATE rrh_user SET name = ?, phone_number = ?, address = ?, nationality = ?, languages = ? WHERE id = ?");
        $updateUserStmt->execute([$name, $phone_number, $address, $nationality, $languages, $user_id]);

        // Check if social links exist for the user
        $checkSocialLinksStmt = $pdo->prepare("SELECT user_id FROM social_links WHERE user_id = ?");
        $checkSocialLinksStmt->execute([$user_id]);
        $socialLinksRow = $checkSocialLinksStmt->fetch(PDO::FETCH_ASSOC);

        if ($socialLinksRow) {
            // Update existing social links
            $updateSocialLinksStmt = $pdo->prepare("UPDATE social_links SET facebook = ?, instagram = ?, linkedin = ?, youtube = ? WHERE user_id = ?");
            $updateSocialLinksStmt->execute([$facebook, $instagram, $linkedin, $youtube, $user_id]);
        } else {
            // Insert new social links
            $insertSocialLinksStmt = $pdo->prepare("INSERT INTO social_links (user_id, facebook, instagram, linkedin, youtube) VALUES (?, ?, ?, ?, ?)");
            $insertSocialLinksStmt->execute([$user_id, $facebook, $instagram, $linkedin, $youtube]);
        }

        $response = [
            'status' => true,
            'message' => 'User profile updated successfully'
        ];
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
