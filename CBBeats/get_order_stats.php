<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

// Only allow admin access for these stats
if (!isset($_SESSION['admin_email'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

/*
  Query 1: Revenue & Orders Count
  - Weekly, monthly, annual revenue is calculated only on orders with status "Completed".
  - Orders count: number of orders placed today, in the past week, and in the current month.
  
  Note:
  - CURDATE() returns the current date.
  - We use conditional SUM and COUNT with CASE statements.
*/
$queryRevenue = "
SELECT
    IFNULL(SUM(CASE WHEN DATE(order_date) >= CURDATE() - INTERVAL 7 DAY THEN total ELSE 0 END), 0) AS weekly_revenue,
    IFNULL(SUM(CASE WHEN DATE(order_date) >= DATE_FORMAT(CURDATE() ,'%Y-%m-01') THEN total ELSE 0 END), 0) AS monthly_revenue,
    IFNULL(SUM(CASE WHEN YEAR(order_date) = YEAR(CURDATE()) THEN total ELSE 0 END), 0) AS annual_revenue,
    IFNULL(SUM(CASE WHEN DATE(order_date) = CURDATE() THEN 1 ELSE 0 END), 0) AS orders_today,
    IFNULL(SUM(CASE WHEN DATE(order_date) >= CURDATE() - INTERVAL 7 DAY THEN 1 ELSE 0 END), 0) AS orders_this_week,
    IFNULL(SUM(CASE WHEN MONTH(order_date) = MONTH(CURDATE()) AND YEAR(order_date) = YEAR(CURDATE()) THEN 1 ELSE 0 END), 0) AS orders_this_month
FROM orders
WHERE status = 'Completed'
";
$resultRevenue = $conn->query($queryRevenue);
if(!$resultRevenue) {
    echo json_encode(['status' => 'error', 'message' => 'Revenue query failed: ' . $conn->error]);
    exit;
}
$revenueStats = $resultRevenue->fetch_assoc();

/*
  Query 2: Top Foods Ordered
  - We join the order_items table with orders (filtering on status "Completed").
  - We then group by item name (alias "food") and sum up the quantity sold.
  - Finally, we order in descending order and limit the result to the top 5 foods.
*/
$queryTopFoods = "
SELECT 
    oi.item_name AS food, 
    SUM(oi.quantity) AS total_sold
FROM order_items oi 
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'Completed'
GROUP BY oi.item_name
ORDER BY total_sold DESC
LIMIT 5
";
$resultTopFoods = $conn->query($queryTopFoods);
if(!$resultTopFoods) {
    echo json_encode(['status' => 'error', 'message' => 'Top foods query failed: ' . $conn->error]);
    exit;
}

$topFoods = [];
while ($row = $resultTopFoods->fetch_assoc()) {
    $topFoods[] = $row;
}

// Output the data as JSON
echo json_encode([
    'status' => 'success',
    'revenue_stats' => $revenueStats,
    'top_foods' => $topFoods
]);

$conn->close();
?>
