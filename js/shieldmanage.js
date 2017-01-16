var currentservice = getserviceid();
var currentedit = "";
var ranonce = false;
$(document).ready(function(){
  getinfo();
  IsAdmin();
  getservices();
  getfirewallrules();
  getstatssubs();
  $("#chart-div").hide();
  $('tr').click(function(event) {
    if (event.target.type !== 'checkbox') {
      $(':checkbox', this).trigger('click');
    }
  });
  setInterval(function(){
    getinfo();
  }, 2500);
});

$("#dns-create").click(function(){
     $("#new-record-div").toggle();
});

var beforedata;
function getinfo(){
    var hostname = {hostname: $_GET("id")};
	 isloggedin();
         $.ajax({
            type:"POST",
            url: "/api/shield/view",
            data: JSON.stringify(hostname),
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {
      		  var data = JSON.parse(result);
              if (result != beforedata){
                beforedata = result;
                if (data.serviceid != "Premium"){
                  $('#stats-tab').hide();
                }
                //Display subdomains in table
                var allrecords = $('#dns-table').clone().html("");
                if(data.record != null){
                  for (var i = 0; i < data.records.length; i++) {
                      tr = $('<tr>');
                      tr.append("<td><strong>" + data.records[i].type +"</strong></td>");
                      tr.append("<td>" + data.records[i].name +"</td>");
                      if (data.records[i].type == "MX"){
                        tr.append("<td>" + "<span class='text-muted'>mail handled by </span>" + data.records[i].content +"</td>");
                      }else if (data.records[i].type == "CNAME"){
                        tr.append("<td>" + "<span class='text-muted'>is an alias of </span>" + data.records[i].content +"</td>");
                      }else if (data.records[i].type == "A" || data.records[i].type == "AAAA"){
                        tr.append("<td>" + "<span class='text-muted'>points to </span>" + data.records[i].content +"</td>");
                      }else{
                        tr.append("<td>" + data.records[i].content +"</td>");
                      }
                      tr.append(`<td><button class='btn btn-info' type='button' onclick='<button class='btn btn-danger' type='button' onclick='DeleteRecord("`+data.records[i].name+`")'>Delete</button></td>`);
                      allsubs = allsubs.append(tr);
                  }
                }
                $('#dns-table').replaceWith(allrecords)

                //Load in settings
                $('#new-dns-domain').html("."+data.hostname);
                if (data.hstsenabled){
        					$('#hsts-box').attr('checked', true);
        				}
                if (data.gzipenabled){
        					$('#gzip-box').attr('checked', true);
        				}
        				if (data.forcehttps){
        					$('#forcehttps-box').attr('checked', true);
        				}
                if (data.cachedisabled){
                  $('#cache-box').attr('checked', true);
                }
                if (data.wafdisabled == false){
                  $('#waf-box').attr('checked', true);
                }
                currentservice = data.serviceid;
                $("#hostname-title").html(data.hostname);
                //$("#devmode-info").html("<i class='fa fa-hdd-o' style='font-size: 1.5em;'></i><strong> Development Mode: </strong>"+isenabled(data.cachedisabled));
                $("#plan-info").html("<i class='fa fa-user' style='font-size: 1.5em;'></i><strong> Plan: </strong>"+data.serviceid);
                //$("#ssl-info").html("<i class='fa fa-lock' style='font-size: 1.5em;'></i><strong> SSL: </strong>"+isenabled(data.sslenabled));
                $("#waf-info").html("<i class='fa fa-shield' style='font-size: 1.5em;'></i><strong> WAF: </strong>"+isenabled(!data.wafdisabled));
              }
          },
          error: function(result){
            window.location.assign("/app/shield");
          },
    });
}

$("#recheck").click(function(){
     ranonce = false;
     var req = {hostname: $_GET("id")};
     $.ajax({
        type:"POST",
        url: "/api/shield/recheck",
        data: JSON.stringify(req),
        beforeSend: function (request)
        {
            request.setRequestHeader("Authorization", localStorage.getItem("token"));
        },
        success: function(result) {
          pagealert("success", result);
       },
        error: function(result) {
          pagealert("error", result.responseText);
       },
    });
});

function DisplayAllMissingRecords(subs){
  $('#dnsrecord_table').html("");
  for (var i = 0; i < subs.length; i++){
    if (subs[i].disabled){
      DisplayMissingRecord(subs[i].domains[0])
    }
  }
  ranonce = true;
  $("#recheck-records-panel").show();
}

function LoadSub(name, host, port){
  $("#manage-dns").show();
  currentedit = name;
  $("#manage-dns-host").val(host);
  $("#manage-dns-port").val(port);
}

function InstallSSLSub(name){
  var req = {hostname: $_GET("id"), sub: name};
  $.ajax({
     type:"POST",
     url: "/api/shield/sub/sslinstall",
     data: JSON.stringify(req),
     beforeSend: function (request)
     {
         request.setRequestHeader("Authorization", localStorage.getItem("token"));
     },
     success: function(result) {
       pagealert("success", result);
    },
     error: function(result) {
       pagealert("error", result.responseText);
    },
 });
}

function DisableSSLSub(name){
  var req = {hostname: $_GET("id"), sub: name};
  $.ajax({
     type:"POST",
     url: "/api/shield/sub/ssldisable",
     data: JSON.stringify(req),
     beforeSend: function (request)
     {
         request.setRequestHeader("Authorization", localStorage.getItem("token"));
     },
     success: function(result) {
       pagealert("success", result);
    },
     error: function(result) {
       pagealert("error", result.responseText);
    },
 });
}

//Add confirm popup for this
function DeleteSub(name){
  var req = {hostname: $_GET("id"), sub: name};
  if (name == currentedit){
  $("#manage-dns").hide();
  }
  $.ajax({
     type:"POST",
     url: "/api/shield/sub/delete",
     data: JSON.stringify(req),
     beforeSend: function (request)
     {
         request.setRequestHeader("Authorization", localStorage.getItem("token"));
     },
     success: function(result) {
       pagealert("success", result);
    },
     error: function(result) {
       pagealert("error", result.responseText);
    },
 });
}

$("#sub-create").click(function(){
     $("#new-dns").toggle();
});

$("#delete-shield").click(function(){
    swal({
    title: "WARNING! Are you sure you want to delete your shield?",
    text: "You will not be able to recover this data",
    type: "warning",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "Yes, delete it!",
    closeOnConfirm: true
  },
  function(){
    var req = {hostname: $_GET("id")};
    $.ajax({
       type:"POST",
       url: "/api/shield/delete",
       data: JSON.stringify(req),
       beforeSend: function (request)
       {
           request.setRequestHeader("Authorization", localStorage.getItem("token"));
       },
       success: function(result) {
         pagealert("success", result);
         window.location.assign("/app/shield");
      },
       error: function(result) {
         pagealert("error", result.responseText);
      },
   });
  });
});

$("#new-dns-create").click(function(){
     var req = {hostname: $_GET("id"), sub: $("#new-dns-sub").val(), host: $("#new-dns-host").val(), port: parseInt($("#new-dns-port").val())};
     $.ajax({
        type:"POST",
        url: "/api/shield//create",
        data: JSON.stringify(req),
        beforeSend: function (request)
        {
            request.setRequestHeader("Authorization", localStorage.getItem("token"));
        },
        success: function(result) {
          pagealert("success", result);
          $("#new-dns-sub").val("");
          $("#new-dns-host").val("");
          $("#new-dns-port").val("");
          $("#new-dns").hide();
       },
        error: function(result) {
          pagealert("error", result.responseText);
       },
    });
});

function isenabled(bool){
  var result = ""
  if (bool){
    result = "Enabled"
  }else{
    result = "Disabled"
  }
  return result
}

function reloadfirewallrules(){
  $("#firewall-table").html("");
  getfirewallrules();
}

function getfirewallrules(){
	 isloggedin();
   var req = {hostname: $_GET("id")};
         $.ajax({
            type:"POST",
            url: "/api/shield/firewall/list",
            data: JSON.stringify(req),
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {
    				var data = JSON.parse(result);
    				var p;
            if (data != null) {
                for (var i = 0; i < data.length; i++) {
                      if (data[i].block == false) {
                        tr = $('<tr>');
                        tr.append("<td>" + "<div class='green'>Accept</div>" +"</td>");
                        tr.append("<td>" + data[i].ipcidr + "</td>");
                        tr.append(`<td><button class='btn btn-danger' type='button' onclick='DeleteFirewallRule("`+data[i].ipcidr+`", false)'>Delete</button></td>`);
                        $("#firewall-table").append(tr)
                      }
                }
                for (var i = 0; i < data.length; i++) {
                      if (data[i].block == true) {
                        tr = $('<tr>');
                        tr.append("<td>" + "<div class='red'>Block</div>" +"</td>");
                        tr.append("<td>" + data[i].ipcidr + "</td>");
                        tr.append(`<td><button class='btn btn-danger' type='button' onclick='DeleteFirewallRule("`+data[i].ipcidr+`", true)'>Delete</button></td>`);
                        $("#firewall-table").append(tr)
                      }
                }
              }
            },
    });
}

function DeleteFirewallRule(ipcidr, isblocked){
        var container = {hostname: $_GET("id"), ipcidr: ipcidr, block: isblocked};
        isloggedin();
        $.ajax({
          type:"POST",
          url: "/api/shield/firewall/delete",
          data: JSON.stringify(container),
          beforeSend: function (request)
          {
              request.setRequestHeader("Authorization", localStorage.getItem("token"));
          },
          success: function(result) {
              pagealert("success", result);
              reloadfirewallrules();
          },
          error: function(result) {
              pagealert("error", result.responseText);
          },
      });
}

$("#fr-create").click(function(){
    var type = false;
    if ($("#fr-type").val() == "Block") {
      type = true;
    }
     var req = {hostname: $_GET("id"), ipcidr: $("#fr-ipcidr").val(), block: type};
     $.ajax({
        type:"POST",
        url: "/api/shield/firewall/new",
        data: JSON.stringify(req),
        beforeSend: function (request)
        {
            request.setRequestHeader("Authorization", localStorage.getItem("token"));
        },
        success: function(result) {
          pagealert("success", result);
          reloadfirewallrules();
       },
        error: function(result) {
          pagealert("error", result.responseText);
       },
    });
});

$("#renew").click(function(){
    swal({
    title: "Are you sure you want to renew your shield?",
    text: "You will be charged from your balance",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "Yes, Renew it!",
    closeOnConfirm: true
  },
  function(){
    var req = {hostname: $_GET("id")};
	 isloggedin();
         $.ajax({
            type:"POST",
            url: "/api/shield/renew",
            data: JSON.stringify(req),
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {
                pagealert("success", result);
            },
            error: function(result) {
				pagealert("error", result.responseText);
	  }
	 });
  });
});

$('#waf-box').click(function() {
	var req = {hostname: $_GET("id"), enabled: $(this).prop(('checked'))};
        $.ajax({
           type:"POST",
           url: "/api/shield/settings/waf",
           data: JSON.stringify(req),
           beforeSend: function (request)
           {
               request.setRequestHeader("Authorization", localStorage.getItem("token"));
           },
           success: function(result) {
			   pagealert("success", result)
			},
		   error: function(result) {
			   pagealert("error", result.responseText)
			},
   });
});

$('#cache-box').click(function() {
	var req = {hostname: $_GET("id"), enabled: $(this).prop(('checked'))};
        $.ajax({
           type:"POST",
           url: "/api/shield/settings/cache",
           data: JSON.stringify(req),
           beforeSend: function (request)
           {
               request.setRequestHeader("Authorization", localStorage.getItem("token"));
           },
           success: function(result) {
			   pagealert("success", result)
			},
		   error: function(result) {
			   pagealert("error", result.responseText)
			},
   });
});

$('#forcehttps-box').click(function() {
	var req = {hostname: $_GET("id"), enabled: $(this).prop(('checked'))};
        $.ajax({
           type:"POST",
           url: "/api/shield/settings/https",
           data: JSON.stringify(req),
           beforeSend: function (request)
           {
               request.setRequestHeader("Authorization", localStorage.getItem("token"));
           },
           success: function(result) {
			   pagealert("success", result)
			},
		   error: function(result) {
			   pagealert("error", result.responseText)
			},
   });
});

$('#hsts-box').click(function() {
	var req = {hostname: $_GET("id"), enabled: $(this).prop(('checked'))};
        $.ajax({
           type:"POST",
           url: "/api/shield/settings/hsts",
           data: JSON.stringify(req),
           beforeSend: function (request)
           {
               request.setRequestHeader("Authorization", localStorage.getItem("token"));
           },
           success: function(result) {
			   pagealert("success", result)
			},
		   error: function(result) {
			   pagealert("error", result.responseText)
			},
   });
});

$('#gzip-box').click(function() {
	var req = {hostname: $_GET("id"), enabled: $(this).prop(('checked'))};
        $.ajax({
           type:"POST",
           url: "/api/shield/settings/gzip",
           data: JSON.stringify(req),
           beforeSend: function (request)
           {
               request.setRequestHeader("Authorization", localStorage.getItem("token"));
           },
           success: function(result) {
			   pagealert("success", result)
			},
		   error: function(result) {
			   pagealert("error", result.responseText)
			},
   });
});

$("#service_upgrade").click(function(){
    swal({
    title: "Are you sure you want to upgrade your shield?",
    text: "You will be charged from your balance",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "Yes, Upgrade it!",
    closeOnConfirm: true
  },
  function(){
    var req = {hostname: $_GET("id"), serviceid: document.querySelector('input[name="SID"]:checked').value};
  	if (document.querySelector('input[name="SID"]:checked') == null){
  		pagealert("error", "You forgot to select a package");
  	}else{
      isloggedin();
            $.ajax({
               type:"POST",
               url: "/api/shield/upgrade",
               data: JSON.stringify(req),
               beforeSend: function (request)
               {
                   request.setRequestHeader("Authorization", localStorage.getItem("token"));
               },
               success: function(result) {
                   pagealert("success", result);
               },
               error: function(result) {
   				        pagealert("error", result.responseText);
   	  }
   	  });
    }
  });
});

function getservices(){
		   isloggedin();
            $.ajax({
            type:"GET",
            url: "/api/shield/services/list",
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {
				var data = JSON.parse(result);
				var tr;
				for (var i = 0; i < data.length; i++) {
          if (data[i].name != currentservice) {
					tr = $("<input class='deploy_checkbox' name='SID' value='" + data[i].name + "' id='SID"+data[i].name+"' type='radio'></input>");
					lbl = $("<label for='SID" + data[i].name + "'> <span class='deploy_checkbox_icon'><i class='fa fa-money package_icon' style='font-size: 1em;'></i></span><span class='deploy_checkbox_line1'>" + data[i].name + ": $"+data[i].price+"/Month</span></span></label>");
					$('#services_list').append(tr);
					$('#services_list').append(lbl);
          }
				}

            }
    });
}

function getstatssubs(){
    var hostname = {hostname: $_GET("id")};
	 isloggedin();
         $.ajax({
            type:"POST",
            url: "/api/shield/view",
            data: JSON.stringify(hostname),
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {
      				var data = JSON.parse(result);
              //Load in websites for stats
              var monitorsubs = $('#livestats-subs').clone().html("");
              if (data.subs != null) {
                for (var i = 0; i < data.subs.length; i++) {
                    monitorsubs = monitorsubs.append(`<option value="`+data.subs[i].name+`">`+data.subs[i].domains[0]+`</option>`);
                }
              }
              $('#livestats-subs').replaceWith(monitorsubs)
            },
   });
 }


function getserviceid(){
    var hostname = {hostname: $_GET("id")};
    var localserviceid = ""
	 isloggedin();
         $.ajax({
            type:"POST",
            url: "/api/shield/view",
            data: JSON.stringify(hostname),
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {
      				var data = JSON.parse(result);
              localserviceid = data.serviceid;
            },
            error: function(result) {
               pagealert("error", result.responseText);
            },
            async: false,
   });
   return localserviceid
 }

var livestatsIntervalId;
 var dps = [];
 var aps = [];

 var chart = new CanvasJS.Chart("chartContainer",{
 			title :{
 				text: "Live traffic for Shield"
 			},
 			axisX:{
 				title: "Time",
 				valueFormatString: "m s"
 			  },
 			  axisY:{
 				title: "Request/s"
 			  },
 			data: [
 			{
 				name: "Attack Traffic",
 				legendMarkerType: "square",
 				showInLegend: true,
 				type: "splineArea",
 				color: "rgba(192, 57, 43,1.0)",
 				dataPoints: aps
 			},
 			{
 				name: "Clean Traffic",
 				legendMarkerType: "square",
 				showInLegend: true,
 				type: "splineArea",
 				color: "rgba(39, 174, 96,1.0)",
 				dataPoints: dps
 			}]
 		});

 function updatechart(good, bad) {
 			var xVal = new Date();
 			dps.push({
 					x: xVal,
 					y: good
 			});
 			aps.push({
 					x: xVal,
 					y: bad
 			});
 			if (dps.length > 300)
 			{
 				dps.shift();
 			}
 			if (aps.length > 300)
 			{
 				aps.shift();
 			}
 			chart.render();
 };

 function getstats(hostname, sub){
     var hostname = {hostname: hostname, sub : sub};
 	 isloggedin();
          $.ajax({
             type:"POST",
             url: "/api/shield/sub/stats",
             data: JSON.stringify(hostname),
             beforeSend: function (request)
             {
                 request.setRequestHeader("Authorization", localStorage.getItem("token"));
             },
             success: function(result) {
       				var data = JSON.parse(result);
       				updatechart(data.goodrps, data.badrps);
           },
     });
 }

 $("#livestats-monitor").click(function(){
    clearInterval(livestatsIntervalId);
    for (var i = 0; i < 300; i++)
    {
      dps.shift();
      aps.shift();
    }
    $("#chart-div").show();
    viewingsub = $("#livestats-subs").val();
    livestatsIntervalId = setInterval(function(){
      getstats($_GET("id"), viewingsub);
    }, 1000);
 });
