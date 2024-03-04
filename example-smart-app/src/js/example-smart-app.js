(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart) {
      if (smart.hasOwnProperty('patient')) {
        
        var patient = smart.patient;
        var pt = patient.read();

        //var obv = smart.patient.api.fetchAll( {
        //            type: 'Observation'
        //          });
        //$.when(pt, obv).fail(onError);
        
        var meds = smart.patient.api.fetchAll( {
                    type: 'MedicationOrder'
                  });
        $.when(pt, meds).fail(onError);

        $.when(pt, meds).done(function(patient, medications) {
          
          console.log(patient);
          var name = '';
          var fname = '';
          var lname = '';
          if (typeof patient.name[0] !== 'undefined') {
            name = patient.name[0].text;
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }
          var gender = patient.gender;
          
          var p = defaultPatient();
          p.name = name;
          p.fname = fname;
          p.lname = lname;
          p.gender = gender;
          p.birthdate = patient.birthDate;
          
          populateActiveMedicationTable(medications);
          
          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      name: {value: ''},
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''}
    };
  }

  function populateActiveMedicationTable(meds){
    $('#medsTable').empty();
    $('#medsTable').append("<tr><th>ACTIVE MEDICATION</th><th>Status</th><th>Date Written</th><th>Date Ended</th><th>Dosage Instructions</th></tr>");
    
    for(var i in meds){
      var med = meds[i]
      console.log(med)
      if(med.status == 'active'){
        var row = "<tr><td>" + med.medicationCodeableConcept.text + "</td><td>" + med.status + "</td><td>" + med.dateWritten + "</td><td>" + med.dateEnded + "</td><td>" + med.dosageInstruction.text + "</td></tr>";
        $('#medsTable').append(row);
      }
    }
  }

  function populateObservationTable(obs){
    $('#obsTable').empty();
    $('#obsTable').append("<tr><th>Text</th><th>Value</th><th>Unit</th>");
    
    for(var i in obs){
      var ob = obs[i]
      if(ob.valueQuantity){
        var row = "<tr><td>" + ob.code.text + "</td><td>" + ob.valueQuantity.value + "</td><td>" + ob.valueQuantity.unit + "</td></tr>";
        $('#obsTable').append(row);
      }
    }
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#name').html(p.name);
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
  };

})(window);
