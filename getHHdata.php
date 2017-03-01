<?php

include('../db.php');

// Connect to the database server
// ini_set("mysqli.default_socket","/tmp/mysql.sock");
$db = mysqli_connect($server,$dbUserName,$dbUserPass,$dbName);

if (mysqli_connect_errno()) {
    print '<p class="alert alert-error">Oh, dear. The connect failed: ' . mysqli_connect_error() . '. Please email philipp.grunewald@ouce.ox.ac.uk about it.</p>';
    exit();
}
$dotcolours = array( '#c66', '#cc6', '#6cc', '#c6c', '#6c6', '#ccffcc', '#cc00ff', '#ccff00', '#ccffff', '#cccccc');

$actColours = array( 'care_self'=>'#cec', 'care_other'=>'#ace', 'care_house'=>'#eda', 'recreation'=>'#ece', 'travel'=>'#eea', 'food'=>'#cea', 'work'=>'#cde', 'other_category'=>'#eec');

$actLocation = array( '1'=>'Home', '2'=>'Travelling', '3'=>'At work', '4'=>'Public place', '5'=>'Outdoors', '6'=>'Garden', '7'=>'Somewhere else');

$labels = array( 'Person 1','Person 2','3','4','5','6','7','8','9');

//$householdID = 7929;
$householdID = $_GET[hh];
$sqlq = "SELECT idMeta FROM Meta WHERE Household_idHousehold = '" . $householdID . "' AND DataType = 'A'";
        
if (!mysqli_query($db,$sqlq))
  {
  die('I am sorry - something went wrong. Please email philipp.grunewald@ouce.ox.ac.uk.!!  ' . mysqli_error());
  }
else
{
   $r_user =  mysqli_query($db,$sqlq);
   $output = array();
   $userCount = 0;
   while($userID = mysqli_fetch_assoc($r_user)) {

        $sqlq = "SELECT idActivities,dt_activity,activity,location,enjoyment,category FROM Activities WHERE Meta_idMeta = ". $userID['idMeta'];
        $r_act =  mysqli_query($db,$sqlq);
        $activities = array();
        while($act = mysqli_fetch_assoc($r_act)) {
            $loc = $act['location'];
            $act['location_label'] = $actLocation[$loc];
            $act['period'] = substr_replace($act['dt_activity'],'0:00',-4);
            $cat = $act['category'];
            if ($cat == '') { $cat = 'other_category';}
            $act['dotcolour'] = $actColours[$cat];
            $activities[] = $act;
        }
        $userActivities = array('activities'=>$activities);
        $userColour = array('dotcolour'=>$dotcolours[$userCount]);
        $userLabel  = array('label'    =>$labels[$userCount]);
        $userEntry = array_merge($userID,$userLabel,$userColour,$userActivities);
        $output["users"][] = $userEntry; // idMeta
        $userCount +=1;
    }
   //echo json_encode($output);


// ELECTRICITY


   $eLabels = array( 'data'=>'Electricity', 'x_axis'=>'Time', 'y_axis'=>'Demand [Watt]');

   $sqlq = "SELECT idMeta FROM Meta WHERE Household_idHousehold = '" . $householdID . "' AND DataType = 'E'";
   $r_elec_readings =  mysqli_query($db,$sqlq);

   $elec_readings = array();
   $readingsCount = 0;
   while($readingID = mysqli_fetch_assoc($r_elec_readings)) {

       // MAX value
        $sqlq = "SELECT dt,Watt FROM Electricity_1min WHERE Watt > 20 AND Meta_idMeta = " . $readingID['idMeta'] . " ORDER BY Watt DESC LIMIT 1";
        $r_eReading = mysqli_query($db,$sqlq);
        $max_eReading = mysqli_fetch_assoc($r_eReading);
        $max_eReading = array("dt"=>$max_eReading['dt'],"Watt"=> round($max_eReading['Watt']), 'label'=>'Peak');
        // $label_max      = array('label'=>'Peak');
       //  $max_eReading = array_merge($max_eReading, $label_max);

       // MIN value
        $sqlq = "SELECT dt,Watt FROM Electricity_1min WHERE Watt > 20 AND Meta_idMeta = " . $readingID['idMeta'] . " ORDER BY Watt ASC LIMIT 1";
        $r_eReading   = mysqli_query($db,$sqlq);
        $min_eReading = mysqli_fetch_assoc($r_eReading);
        $min_eReading = array("dt"=>$min_eReading['dt'],"Watt"=> round($min_eReading['Watt']), 'label'=>'Min');
        // $label_min    = array('label'=>'Min');
        // $min_eReading = array_merge($min_eReading, $label_min);

       // AVG value
        $sqlq = "SELECT AVG(Watt) FROM Electricity_1min WHERE Watt > 20 AND Meta_idMeta = " . $readingID['idMeta'];
        $r_eReading   = mysqli_query($db,$sqlq);
        $avg_eReading = mysqli_fetch_assoc($r_eReading);
        $avg_eReading = array("Watt"=> round($avg_eReading['AVG(Watt)']), 'label'=>'Mean');

        // All 1 min readings
        $sqlq = "SELECT dt,Watt FROM Electricity_1min WHERE Watt > 20 AND Meta_idMeta = " . $readingID['idMeta'];
        $r_eReading =  mysqli_query($db,$sqlq);
        $dt = array();
        $Watt = array();
        while($eReading = mysqli_fetch_assoc($r_eReading)) {
            $dt[] = $eReading['dt'];
            $Watt[] = $eReading['Watt'];
        }

        // All 10 min readings
        $sqlq = "SELECT dt,Watt FROM Electricity_10min WHERE Meta_idMeta = " . $readingID['idMeta'];
        $r_eReading =  mysqli_query($db,$sqlq);
        $dt_tem = array();
        $Watt_ten = array();
        while($eReading = mysqli_fetch_assoc($r_eReading)) {
            $dt_ten[] = $eReading['dt'];
            $Watt_ten[] = $eReading['Watt'];
        }

        $reading_dt     = array('dt'=>$dt);
        $reading_Watt   = array('Watt'=>$Watt);
        $reading_labels = array('labels'=>$eLabels);
        $label_max      = array('label'=>'Peak demand');
        $label_min      = array('label'=>'Your baseload');

        $reading_max    = array('max'=>$max_eReading);
        $reading_min    = array('min'=>$min_eReading);
        $reading_avg    = array('avg'=>$avg_eReading);
        $annotations    = array_merge($reading_max, $reading_min, $reading_avg);
        $reading_annotations = array('annotations'=>$annotations);

        $electricityEntry = array_merge($reading_labels,$reading_annotations,$reading_dt,$reading_Watt);
        $output["readings"][] = $electricityEntry;
   }
   echo json_encode($output);
}
mysqli_close($db);
?>
