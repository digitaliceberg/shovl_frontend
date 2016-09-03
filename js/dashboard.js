$(document).ready(function(){
	isloggedin();
    $("#menubar").hide();
    $("#admin_div").hide();
    getservices();
    getpackages();
    getcontainers();
    if(IsAdmin()){
		$("#menubar").show();	
	}
});

$("#main_tab").click(function(){
    $("#main_div").show();
    $("#admin_div").hide();
    $("#admin_tab").removeClass('pure-menu-selected');
    $('#main_tab').addClass('pure-menu-selected');
})

$("#admin_tab").click(function(){
    $("#main_div").hide();
    $("#admin_div").show();
    $('#main_tab').removeClass('pure-menu-selected');
    $("#admin_tab").addClass('pure-menu-selected');
})

$("#newwebsite").click(function(){	
	window.location.assign("/app/create");
});


$("#createpackage").click(function(){	
	 var package = {name: $("#package_name").val(), price: parseFloat($("#package_amount").val()), ram: parseInt($("#package_ram").val()), diskspace: parseInt($("#package_disk").val())};
	 isloggedin();
         $.ajax({
            type:"POST",
            url: "/api/packages/new",
            data: JSON.stringify(package),
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {	
				sweetAlert("Well done!", "Package has been created", "success");				
            },
            error: function(result) {
				sweetAlert("Oops...", result.responseText, "error");	
	  }
		});	
});

$("#createservice").click(function(){	
	 var package = {name: $("#service_name").val()};
	 isloggedin();
         $.ajax({
            type:"POST",
            url: "/api/services/new",
            data: JSON.stringify(package),
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {	
				sweetAlert("Well done!", "Service has been created", "success");				
            },
            error: function(result) {
				sweetAlert("Oops...", result.responseText, "error");	
	  }
		});	
});

function getcontainers(){
	 isloggedin();
         $.ajax({
            type:"GET",
            url: "/api/containers",
            beforeSend: function (request)
            {
                request.setRequestHeader("Authorization", localStorage.getItem("token"));
            },
            success: function(result) {	
				var data = JSON.parse(result);
				var p;
				for (var i = 0; i < data.length; i++) {
					if (data[i].serviceid != 0){
					tr = $('<tr>');
					tr.append("<td>" + "<i class='fa " + serviceiconfromid(data[i].serviceid) +  " web_icon'></i>" +"</td>");
					tr.append("<td>" + link(data[i].containerid)+data[i].hostname+"</a>" + "</td>");
					tr.append("<td>" + packagename(data[i].packageid) + "</td>");
					tr.append("<td>" + website_status(data[i].status) + "</td>");
					tr.append("<td>" + "expires: " +GiveDate(data[i].expires_stamp) + "</td>");
					$('#service_table').append(tr);
					}
				}
            }
    });	
}

function link(id){
		return '<a href="manage?id='+id+'">';
}