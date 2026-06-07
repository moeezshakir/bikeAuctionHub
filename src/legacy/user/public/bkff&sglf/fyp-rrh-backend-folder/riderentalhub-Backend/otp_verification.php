<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

$response = [];

try {
    $pdo = new PDO("mysql:host=localhost;dbname=if0_36679809_ridehub", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['user_id']) || !isset($data['otp'])) {
        $response = ['status' => false, 'error' => 'Invalid form data'];
        echo json_encode($response);
        exit;
    }

    $user_id = $data['user_id'];
    $otp = $data['otp'];

    // Check if the OTP exists and is valid
    $stmt = $pdo->prepare("SELECT * FROM otp_verification WHERE user_id = ? AND otp = ?");
    $stmt->execute([$user_id, $otp]);
    $otpRecord = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($otpRecord) {
        $current_time = date('Y-m-d H:i:s');
        if ($current_time <= $otpRecord['expiration_time']) {
            // OTP is valid, update account_verified_status in rrh_user table
            $updateStmt = $pdo->prepare("UPDATE rrh_user SET account_verified_status = 1 WHERE id = ?");
            $updateStmt->execute([$user_id]);

            $response = ['status' => true, 'message' => 'OTP verified successfully and account verified status updated.'];
        } else {
            // OTP has expired
            $response = ['status' => false, 'error' => 'OTP has expired.'];
        }
    } else {
        // OTP is invalid
        $response = ['status' => false, 'error' => 'Invalid OTP.'];
    }
} catch (PDOException $e) {
    error_log('PDOException: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'Database error.'];
} catch (Exception $e) {
    error_log('Exception: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'An unexpected error occurred.'];
}

echo json_encode($response);
