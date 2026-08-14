
function Land_Record_Validation() {
   
    var obj = document.getElementById('ctl00_ContentPlaceHolder1_drpLandRecord').selectedIndex;
    if (obj == 0) {
        alert("Select Any One From DropDownList");
        document.getElementById("ctl00_ContentPlaceHolder1_drpLandRecord").focus();
        return false;
    }
    var obj = document.getElementById('ctl00_ContentPlaceHolder1_ddlDistrict').selectedIndex;
    if (obj == '0' || obj == '') {
        alert("Select District/ જીલ્લો પસંદ કરો.");
        document.getElementById("ctl00_ContentPlaceHolder1_ddlDistrict").focus();
        return false;
    }

    obj = document.getElementById('ctl00_ContentPlaceHolder1_ddlTaluka').selectedIndex;
    if (obj == '0' || obj == '') {
        alert("Select Taluka/ તાલુકો પસંદ કરો.");
        document.getElementById("ctl00_ContentPlaceHolder1_ddlTaluka").focus();
        return false;
    }

    obj = document.getElementById('ctl00_ContentPlaceHolder1_ddlVillage').selectedIndex;
    if (obj == '0' || obj == '') {
        alert("Select Village/ ગામ પસંદ કરો.");
        document.getElementById("ctl00_ContentPlaceHolder1_ddlVillage").focus();
        return false;
    }  
}

function Taluka_Validation() {
    var obj = document.getElementById('ctl00_ContentPlaceHolder1_ddlDistrict').selectedIndex;
    if (obj == '0' ) {
        alert("Select District/ જીલ્લો પસંદ કરો.");
        document.getElementById("ctl00_ContentPlaceHolder1_ddlDistrict").focus();
        return false;
    }
}

function Village_Validation() {
    var obj = document.getElementById('ctl00_ContentPlaceHolder1_ddlTaluka').selectedIndex;
    if (obj == '-1') {
        alert("Select District/ જીલ્લો પસંદ કરો.");
        document.getElementById("ctl00_ContentPlaceHolder1_ddlDistrict").focus();
        return false;
    }
    if (obj == '0') {
        alert('taluka validation')
        alert("Select Taluka/ તાલુકો પસંદ કરો.");
        document.getElementById("ctl00_ContentPlaceHolder1_ddlTaluka").focus();
        return false;
    }
}

function Sno_Validation() {

    var obj = document.getElementById('ctl00_ContentPlaceHolder1_ddlVillage').selectedIndex;
    if (obj == '-1') {
        alert("Select District/ જીલ્લો પસંદ કરો. \nSelect Taluka/ તાલુકો પસંદ કરો. \nSelect Village/ ગામ પસંદ કરો.");
        document.getElementById("ctl00_ContentPlaceHolder1_ddlDistrict").focus();
        return false;
    }
    if (obj == '0' ) {
        alert("Select Village/ ગામ પસંદ કરો.");
        document.getElementById("ctl00_ContentPlaceHolder1_ddlVillage").focus();
        return false;
    }
}
function OnlyNumeric(obj) {
   // alert(event.keyCode)
    if (event.keyCode < 48 || event.keyCode > 57) {

        //alert('Only numeric value is allowed ')
        event.keyCode = 0;
       // return false;
    }
    else {
        
    }
}

