<!DOCTYPE html>
<html lan="en">
<head>
  <meta charset="utf-8">
  <title>METER - Energy-use.org</title>
  <link rel="stylesheet" type="text/css" href="../css/meter.css">
  <link rel="stylesheet" type="text/css" href="../css/bootstrap.min.css">
  <?php include('../libs/libs.php'); ?>
</head>
<body>
  <?php
    $id='7989';
    if(isset($_GET['id'])){ $id = $_GET['id']; }
    echo '<script>var hhid = "'.$id.'";</script>';
	include('../_nav_bar_subfolder.php');
	include('../db.php');
	$db = mysqli_connect($server,$dbUserName,$dbUserPass,$dbName);

   $sqlq = "SELECT idMeta FROM Meta WHERE Household_idHousehold = '" . $id . "' AND DataType = 'E'";
   $q_idMeta = mysqli_query($db,$sqlq);
   $f_idMeta = mysqli_fetch_assoc($q_idMeta);
   $idMeta   = $f_idMeta['idMeta'];

   $fromEl = "FROM Electricity_1min WHERE Watt > 20 AND Meta_idMeta = " . $idMeta;
   $fromAll = "FROM Electricity_1min WHERE Watt > 20"; 

   // HH Peak - SUPERSEEDED by Peak Hour
   // $sqlq = "SELECT dt,Watt " . $fromEl . " ORDER BY Watt DESC LIMIT 1";
   // $q = mysqli_query($db,$sqlq);
   // $f = mysqli_fetch_assoc($q);
   // $dtPeak = $f['dt'];
   // $peak   = round($f['Watt']);

	
   // HH Peak hour
   $sqlq = "SELECT dt,WattHour FROM (
	SELECT E.dt, SUM(E_hour.Watt) AS SumHour,AVG(E_hour.Watt) AS WattHour
	FROM Electricity_10min AS E
	JOIN Electricity_10min as E_hour
	  ON E_hour.dt between E.dt and E.dt + INTERVAL 1 HOUR
	  AND E_hour.Meta_idMeta = " . $idMeta . "
	  AND E.Meta_idMeta =  " . $idMeta . "
	GROUP BY 1)
	AS RollingAverage 
	ORDER BY SumHour DESC LIMIT 1;";
   $r_eReading = mysqli_query($db,$sqlq);
   $f_peak = mysqli_fetch_assoc($r_eReading);
   $dtPeak = $f_peak['dt'];
   $peak   = round($f_peak['WattHour']);


	date_default_timezone_set('UTC');
	$dtPeakDate = date_create($dtPeak); 
	$peakday = date_format($dtPeakDate, 'l'); 
	$peaktime = date_format($dtPeakDate, 'H:i'); 

	// add peak time appliances
	//
	if(isset($_GET['a2'])){ 
		// add manually typed appliance
		$a2 = $_GET['a2'];
		$dt_rec = date("Y-m-d H:i:s");
		$sqlq= "INSERT INTO Activities (`Meta_idMeta`,`dt_activity`,`dt_recorded`,`activity`) VALUES ('".$idMeta."','".$dtPeak."','".$dt_rec."','".$a2."')";
       	mysqli_query($db, $sqlq);
	}
	if(isset($_GET['a1'])){ 
		// add appliance
		$a1 = $_GET['a1'];
		$dt_rec = date("Y-m-d H:i:s");
		if ($a1 != "Other") {
			$sqlq= "INSERT INTO Activities (`Meta_idMeta`,`dt_activity`,`dt_recorded`,`activity`) VALUES ('".$idMeta."','".$dtPeak."','".$dt_rec."','".$a1."')";
        	mysqli_query($db, $sqlq);
		}
	}

	// get peak appliances
	$sqlq= "SELECT activity FROM Activities WHERE Meta_idMeta = $idMeta AND dt_activity = '$dtPeak'";
	$peakAppliances = [];
	$results = mysqli_query($db, $sqlq);
	while ($result = mysqli_fetch_assoc($results)) {
		$peakAppliances[] = $result['activity'];
		}

   // HH Average
   $sqlq = "SELECT AVG(Watt) as mean " . $fromEl ;
   $q = mysqli_query($db,$sqlq);
   $f = mysqli_fetch_assoc($q);
   $mean = round($f['mean']);

   // HH Baseload
   $sqlq = "SELECT dt,Watt " . $fromEl . " ORDER BY Watt ASC LIMIT 1";
   $q = mysqli_query($db,$sqlq);
   $f = mysqli_fetch_assoc($q);
   $dtBaseload = $f['dt'];
   $baseload   = round($f['Watt']);

	$dtMinDate = date_create($dtBaseload); 
	$minday = date_format($dtMinDate, 'l'); 
	$mintime = date_format($dtMinDate, 'H:i'); 

   // Peak all
   // $sqlq = "SELECT AVG(peakloads) as peakAll FROM peakloads";
   $sqlq = " SELECT AVG(peakloads) as peakAll FROM (   SELECT MAX(`Electricity_1min`.`Watt`) AS `peakloads` FROM `Electricity_1min` WHERE (`Electricity_1min`.`Watt` > 20) GROUP BY `Electricity_1min`.`Meta_idMeta`) as a";
   $q = mysqli_query($db,$sqlq);
   $f = mysqli_fetch_assoc($q);
   $peakAll = round($f['peakAll']);




   // Average all
   $sqlq = "SELECT AVG(Watt) as meanAll " . $fromAll ;
   $q = mysqli_query($db,$sqlq);
   $f = mysqli_fetch_assoc($q);
   $meanAll = round($f['meanAll']);

   // Baseload all
   $sqlq = " SELECT AVG(baseloads) as baseloadAll FROM (   SELECT MIN(`Electricity_1min`.`Watt`) AS `baseloads` FROM `Electricity_1min` WHERE (`Electricity_1min`.`Watt` > 20) GROUP BY `Electricity_1min`.`Meta_idMeta`) as a";
   $q = mysqli_query($db,$sqlq);
   $f = mysqli_fetch_assoc($q);
   $baseloadAll = round($f['baseloadAll']);

  ?>
<div class="container">
 <div class="row">
  <div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2" style="background-color: transparent;">

  <h3>Your electricity profile</h3>
  <p>Thank you for contributing your data to this study. Here is your load profile. </p>
<p>
  <div class="col-xs-12 col-sm-6 col-md-4 rounded-box">
<h3>Minimum <?php echo $baseload; ?>W</h3>
<p>Your lowest electricity use was on <?php echo $minday; ?> at <?php echo $mintime; ?>.
<?php if ($baseload > $baseloadAll) {
		echo " This is higher than the average (".$baseloadAll."W)";
		if ($baseload < (1.4 * $baseloadAll)) {
			echo ", but not by much, ";
		} else {
			echo ", ";
		}
	} else {
		echo " This is lower than our average participant (".$baseloadAll."W), ";
	}
?>
and mostly depends on stand-by devices and things that are always on (fridges, broadband routers...).</p>
</div>
  <div class="col-xs-12 col-sm-6 col-md-4 rounded-box">
<h3>Average <?php echo $mean; ?>W</h3> compared to <?php echo $meanAll; ?>W across our participants.
<?php if ($mean < 0.8*$meanAll) {echo " You are doing well.";}
 else if ($mean < 1.2*$meanAll) {echo " So your are quite typical.";}
 else {echo " Note that there is a lot of variation, depending on household size, type of appliances and activity levels (which is part of what we try to understand with this study).";}
?>
</div>


  <div class="col-xs-12 col-sm-6 col-md-4 rounded-box">
<h3>Max <?php echo $peak; ?>W</h3>
<p>Your hour with the highest use started on <?php echo $peakday; ?> at <b> <?php echo $peaktime; ?></b>. 
</p><p>

<?php
if (count($peakAppliances) < 1) {
	echo "Do you remember which appliances might have been in use in that hour?";
	$appLabel = "Can't remember";
} else {
	echo "You used: <b>";
	foreach ($peakAppliances as $peakAppliance) {
		echo "$peakAppliance - ";
	}
	echo "</b><br>Anything else perhaps?";
	$appLabel = "Nothing else";
} 
?>
</p>

<form class="form-inline" role="form" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="get">
<input type="hidden" id="id" name="id" value="<?php echo $id; ?>">
<select name="a1" id="a1" onchange="this.form.submit()">
<option value="<?php echo $appLabel; ?>"><?php echo $appLabel; ?></option>
  <option disabled>── Laundry ──</option>
  <option <?php if ($a1 == "Tumble dryer") {echo 'selected="selected"';} ?> value="Tumble dryer">Tumble dryer</option>
  <option <?php if ($a1 == "Washing machine") {echo 'selected="selected"';} ?> value="Washing machine">Washing machine</option>
  <option <?php if ($a1 == "Washe-dryer") {echo 'selected="selected"';} ?>  value="Washe-dryer">Washe-dryer</option>
  <option <?php if ($a1 == "Ironing") {echo 'selected="selected"';} ?>  value="Ironing">Ironing</option>
  <option disabled>── Kitchen ──</option>
  <option <?php if ($a1 == "Dishwasher") {echo 'selected="selected"';} ?> value="Dishwasher">Dishwasher</option>
  <option <?php if ($a1 == "Oven") {echo 'selected="selected"';} ?>  value="Oven">Oven</option>
  <option <?php if ($a1 == "Microwave") {echo 'selected="selected"';} ?> value="Microwave">Microwave</option>
  <option <?php if ($a1 == "Kettle") {echo 'selected="selected"';} ?>  value="Kettle">Kettle</option>
  <option <?php if ($a1 == "Toaster") {echo 'selected="selected"';} ?>  value="Toaster">Toaster</option>
  <option disabled>── Entertainment  ──</option>
  <option <?php if ($a1 == "TV") {echo 'selected="selected"';} ?>  value="TV">TV</option>
  <option <?php if ($a1 == "Mobile device") {echo 'selected="selected"';} ?>  value="Mobile device">Mobile device</option>
  <option <?php if ($a1 == "Games / Computer") {echo 'selected="selected"';} ?>  value="Games / Computer">Games / Computer</option>
  <option <?php if ($a1 == "Music / Video") {echo 'selected="selected"';} ?>  value="Music / Video">Music / Video</option>
  <option disabled>── Household ──</option>
  <option <?php if ($a1 == "Vacuum cleaner") {echo 'selected="selected"';} ?>  value="Vacuum cleaner">Vacuum cleaner</option>
  <option <?php if ($a1 == "Heater") {echo 'selected="selected"';} ?>  value="Heater">Heater</option>
  <option <?php if ($a1 == "Tools") {echo 'selected="selected"';} ?>  value="Tools">Tools</option>
  <option <?php if ($a1 == "EV") {echo 'selected="selected"';} ?> value="EV">Electric Vehicle</option>
  <option disabled>── Other ──</option>
  <option <?php if ($a1 == "Other") {echo 'selected="selected"';} ?>  value="Other">Other... [specify]</option>
</select>
<?php if ($a1 == "Other") {
	echo '<input type="text" name="a2" placeholder="if not listed..."  onkeydown = "if (event.keyCode == 13) this.form.submit() ">';
} 
?>
</form>
<p>
</div>

  <div id="canvas"></div>
  <div class='tooltip'></div>

<p>Colours:
<span class="care_self colour-key"> Personal </span> 
<span class="food colour-key"> Food </span> 
<span class="work colour-key"> Work </span> 
<span class="other_category colour-key"> Other </span> 
</p>
  <script type="text/javascript" src="../D3/HHactPower.js"></script>

  <!-- Modal for Users -->
  <div class="modal fade" id="modalActivity" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">

        <!-- Modal Header -->
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
            <span class="sr-only">Close</span>
          </button>
          <h3 class="modal-title" id="modalLabel">Activity</h3>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
            <form id="formEditActivity" action="editactivity"
                  class="form-horizontal" role="form" method="post">
              <input type="hidden" name="id" id="id">
              <div class="form-group">
                <label class="col-sm-3 control-label" for="timestamp">Time</label>
                <div class="col-sm-6">
                    <input type="text" class="form-control" id="timestamp" name="timestamp"/></div></div>
              <div class="form-group">
                <label class="col-sm-3 control-label" for="activity">Activity</label>
                <div class="col-sm-6">
                    <input type="text" class="form-control" id="activity" name="activity"/></div></div>
              <div class="form-group">
                <label class="col-sm-3 control-label" for="location">Location</label>
                <div class="col-sm-6">
                    <input type="text" class="form-control" id="location" name="location"/></div></div>

              <div class="form-group">
                <label class="col-sm-3 control-label" for="enjoyment">Enjoyment</label>
                <div class="col-sm-6">
                    <input type="radio" name="enjoyment" id="enjoyment_1" value="1"> <img src=../img/enjoy_1.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_2" value="2"> <img src=../img/enjoy_2.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_3" value="3"> <img src=../img/enjoy_3.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_4" value="4"> <img src=../img/enjoy_4.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_5" value="5"> <img src=../img/enjoy_1.png width='20px' height='20px'><br></div></div>

              </form>
          <div id='errormsg'></div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
            <button type="button" class="btn btn-danger" data-dismiss="modal"> Cancel </button>
            <button type="button" id="submitActivity" class="btn btn-primary"> Submit Activity </button>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</div>
</body>
</html>
