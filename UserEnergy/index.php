<!DOCTYPE html>
<html lan="en">
<head>
  <meta charset="utf-8">
  <title>METER - Energy-use.org</title>
  <link rel="stylesheet" type="text/css" href="meter.css">
  <script src="libs/d3.v3.js"></script>
	<script src='libs/d3-jetpack.js'></script>
	<script src='libs/d3-starterkit.js'></script>
	<script src="libs/lodash.js"></script>

</head>
<body>
  <?php
    $id='7936';
    if(isset($_GET['id'])){ $id = $_GET['id']; }
    echo '<script>var hhid = "'.$id.'";</script>'
  ?>

  <img id="logo" src="meter_logo_trans.png" alt="METER" width="120">
  <div id="title">Your use of electricity  (<?php echo $id; ?>)</div>

  <div id="canvas"></div>
  <div class='tooltip'></div>

  <script type="text/javascript" src="meter.js"></script>

</body>
</html>