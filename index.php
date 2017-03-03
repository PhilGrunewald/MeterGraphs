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
    $id='7936';
    if(isset($_GET['id'])){ $id = $_GET['id']; }
    echo '<script>var hhid = "'.$id.'";</script>';
	include('_nav_bar_yourdata.php');
	include('../db.php');
	$db = mysqli_connect($server,$dbUserName,$dbUserPass,$dbName);

   $sqlq = "SELECT idMeta FROM Meta WHERE Household_idHousehold = '" . $id . "' AND DataType = 'E'";
   $q_idMeta = mysqli_query($db,$sqlq);
   $f_idMeta = mysqli_fetch_assoc($q_idMeta);
   $idMeta   = $f_idMeta['idMeta'];
   
   $fromEl = "FROM Electricity_1min WHERE Watt > 20 AND Meta_idMeta = " . $idMeta;
   $fromAll = "FROM Electricity_1min WHERE Watt > 20"; 

   // HH Peak 
   $sqlq = "SELECT dt,Watt " . $fromEl . " ORDER BY Watt DESC LIMIT 1";
   $q = mysqli_query($db,$sqlq);
   $f = mysqli_fetch_assoc($q);
   $dtPeak = $f['dt'];
   $peak   = round($f['Watt']);

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
Your <b>average</b> use has been <b><?php echo $mean; ?> Watt</b>, compared to <?php echo $meanAll; ?> W across our participants. These values vary quite a bit day by day and depend on the type of your appliances, season and many other factors (which is part of what we try to understand with this study).</p>

<p>Your <b>baseload</b> is perhaps more informative. The lowest reading over these 28 hours was 
<?php echo "<b>".$baseload; 
	if ($baseload > $baseloadAll) {
		echo " W</b>. This is higher than the average ($baseloadAll W)";
		if ($baseload < (1.4 * $baseloadAll)) {
			echo ", but not by much. ";
		} else {
			echo ". ";
		}
	} else {
		echo " W</b>. You have done better than our average participant ($baseloadAll W). ";
	}
?>
This baseload mostly depends on stand-by devices and things that are always on (fridges, broadband routers...)</p>

<p>The highest recorded electricity use occurred at <?php echo $peaktime; ?> (<?php echo $peak; ?> W). Which appliances do you think might have been on at this point?
</p>

<form class="form-inline" role="form" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="get">
<input type="hidden" id="id" name="id" value="<?php echo $id; ?>">
<select name="Appliance">
  <option value="None">Don't know</option>
  <option value="Oven">Oven</option>
  <option value="Microwave">Microwave</option>
  <option value="EV">Electric Vehicle</option>
  <option value="Dishwasher">Dish washer</option>
  <option value="Washingmachine">Washing machine</option>
  <option value="Tumble Dryer">Tumble dryer</option>
  <option value="Other">Other</option>
</select>
</form>
<p>

 (Just pick the most important, if there were more than one.</p>

  <div id="canvas"></div>
  <div class='tooltip'></div>

  <script type="text/javascript" src="meter.js"></script>

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
                    <input type="radio" name="enjoyment" id="enjoyment_1" value="1"> <img src=img/enjoy_1.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_2" value="2"> <img src=img/enjoy_2.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_3" value="3"> <img src=img/enjoy_3.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_4" value="4"> <img src=img/enjoy_4.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_5" value="5"> <img src=img/enjoy_1.png width='20px' height='20px'><br></div></div>

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
