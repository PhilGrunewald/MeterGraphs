<!DOCTYPE html>
<html lan="en">
<head>
  <meta charset="utf-8">
  <title>METER - Energy-use.org</title>
  <link rel="stylesheet" type="text/css" href="libs/bootstrap.min.css">
  <link rel="stylesheet" type="text/css" href="meter.css">
  <script src="libs/d3.v3.js"></script>
	<script src="libs/lodash.js"></script>
  <script src="libs/jquery-2.2.1.min.js"></script>
  <script src="libs/bootstrap.min.js"></script>
  <script src="https://d3js.org/d3.v4.min.js"></script>
  <!-- <script type="text/javascript" src="d3/d3.js"></script> -->
</head>
<body>
  <?php
	include('_nav_bar_yourdata.php');
	include('../db.php');
	$db = mysqli_connect($server,$dbUserName,$dbUserPass,$dbName);
	if (isset($_GET['id'])) { 
		$id = $_GET['id']; 
		} else {
		$id = 1;
	}

   $sqlq = "SELECT idMeta FROM Meta WHERE Household_idHousehold = '" . $id . "' AND DataType = 'E'";
   $q_idMeta = mysqli_query($db,$sqlq);
   $f_idMeta = mysqli_fetch_assoc($q_idMeta);
   $idMeta   = $f_idMeta['idMeta'];

   if (isset($_GET['eQuality'])) { 
	$sqlq = "UPDATE Meta SET Quality = ".$_GET['eQuality']." WHERE idMeta = ".$idMeta.";";
	mysqli_query($db,$sqlq);
	}
   if (isset($_GET['next'])) { 
	$next = $_GET['next'];
	if ($next == 1) {
		// next one
		$sqlq = "Select Household_idHousehold AS id 
		FROM Meta WHERE Household_idHousehold > $id
		GROUP BY Household_idHousehold 
		ORDER BY Household_idHousehold 
		LIMIT 1;";
	} else if ($next == -1) {
		// previous one
		$sqlq = "Select Household_idHousehold AS id 
		FROM Meta WHERE Household_idHousehold < $id
		GROUP BY Household_idHousehold 
		ORDER BY Household_idHousehold DESC
		LIMIT 1;";
	} else if ($next == 0) {
		// random one
   		$sqlq = "Select Household_idHousehold AS id FROM Meta GROUP BY Household_idHousehold ORDER BY RAND() LIMIT 1;";
   		//$sqlq = "Select Household_idHousehold AS rdm FROM Meta WHERE Quality = 1 GROUP BY Household_idHousehold ORDER BY RAND() LIMIT 1;";
	}
   $q = mysqli_query($db,$sqlq);
   $f = mysqli_fetch_assoc($q);
   $id   = $f['id'];
  }

   echo '<script>var hhid = "'.$id.'";</script>';

   $sqlq = "SELECT idMeta,Quality FROM Meta WHERE Household_idHousehold = '" . $id . "' AND DataType = 'E'";
   $q_idMeta = mysqli_query($db,$sqlq);
   $f_idMeta = mysqli_fetch_assoc($q_idMeta);
   $idMeta   = $f_idMeta['idMeta'];
   $eQuality  = $f_idMeta['Quality'];
?>

<div class="container">
 <div class="row">
  <div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2" style="background-color: transparent;">

<h3>Household <?php echo $id; ?> </h3>
<form>
	<input type="hidden" name="id" value="<?php echo $id; ?>">
	<button name="next" value="-1" class="btn btn-round btn-success" action="galery.php">Prev</button> 
	<button name="next" value="0" class="btn btn-round btn-success" action="galery.php">Random</button> 
	<button name="next" value="1" class="btn btn-round btn-success" action="galery.php">Next</button> 
</br>
<h3>Quality <?php if ($eQuality == 1) {echo "OK";} else {if ($eQuality == '0') {echo "Poor";} else {echo "Unknown";}} ?> </h3>
	<button id="eQuality" name="eQuality" value="1" class="btn btn-round btn-success" action="galery.php">e OK</button> 
	<button id="eQuality" name="eQuality" value="0" class="btn btn-round btn-danger" action="galery.php">e Poor</button> 

</form>
	<div id="canvas"></div>
	<div class='tooltip'></div>

	<p>Colours:
	<span class="care_self colour-key"> Personal </span> 
	<span class="food colour-key"> Food </span> 
	<span class="work colour-key"> Work </span> 
	<span class="other_category colour-key"> Other </span> 
	</p>
  </div> <!-- col -->
 </div> <!-- row -->
</div> <!-- cont -->
<script type="text/javascript" src="meter.js"></script>
</body>
</html>
