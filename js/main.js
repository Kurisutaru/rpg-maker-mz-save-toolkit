var message = [];
var globalFilename = "";
if (!window.FileReader) {
  message = '<p>The ' +
	'<a href="http://dev.w3.org/2006/webapi/FileAPI/"        target="_blank">File API</a>s ' +
	'are not fully supported by this browser.</p>' +
	'<p>Upgrade your browser to the latest version.</p>';
  document.querySelector('body').innerHTML = message;
} else {
  // Set up the file drag and drop listeners:         
  document.getElementById('fileDropBox').addEventListener('dragover', handleDragOver, false);
  document.getElementById('fileDropBox').addEventListener('drop', handleFileSelection, false);
}

function sanitizeHTML(htmlString) {
  var tmp = document.createElement('div');
  tmp.appendChild(document.createTextNode(htmlString));
  return tmp.innerHTML;
} // stripHtmlFromText

function handleDragOver(evt) {
  evt.stopPropagation(); // Do not allow the dragover event to bubble.
  evt.preventDefault(); // Prevent default dragover event behavior.
} // handleDragOver

function displayFileText(evt) {
  var fileString = evt.target.result; // Obtain the file contents, which was read into memory.
  //evt.target is a FileReader object, not a File object; so window.URL.createObject(evt.target) won't work here!
  alert(sanitizeHTML(fileString), {
	width: 40,
	tile: true
  }); // sanitizeHTML() is used in case the user selects one or more HTML or HTML-like files
} // displayFileText

function handleFileReadAbort(evt) {
  alert("File read aborted.");
} // handleFileReadAbort

function handleFileReadError(evt) {
  var message;
  switch (evt.target.error.name) {
	case "NotFoundError":
	  alert("The file could not be found at the time the read was processed.");
	  break;
	case "SecurityError":
	  message = "<p>A file security error occured. This can be due to:</p>";
	  message += "<ul><li>Accessing certain files deemed unsafe for Web applications.</li>";
	  message += "<li>Performing too many read calls on file resources.</li>";
	  message += "<li>The file has changed on disk since the user selected it.</li></ul>";
	  alert(message);
	  break;
	case "NotReadableError":
	  alert("The file cannot be read. This can occur if the file is open in another application.");
	  break;
	case "EncodingError":
	  alert("The length of the data URL for the file is too long.");
	  break;
	default:
	  alert("File error code " + evt.target.error.name);
  } // switch
} // handleFileReadError

function processDecode(evt) {
  var filename = globalFilename.replace(/\.[^/.]+$/, "");
  var zipdata = evt.target.result;
  zipToJson(zipdata).then(data => {
    data = JSON.stringify(JSON.parse(data),null,2);
    sampleArr = base64ToArrayBuffer(data);
    saveByteArray(filename+".json", sampleArr);
    }
  );
}

function processEncode(evt) {
  var filename = globalFilename.replace(/\.[^/.]+$/, "");
  var zipdata = evt.target.result;
  zipdata = JSON.stringify(JSON.parse(zipdata));
  jsonToZip(zipdata).then(data => {
    sampleArr = base64ToArrayBuffer(data);
    saveByteArray(filename+".rmmzsave", sampleArr);
    }
  );

}

function startFileRead(fileObject) {
  var reader = new FileReader();
  reader.abort = handleFileReadAbort;
  reader.onerror = handleFileReadError;

    if(fileObject.name.split('.').pop() == "rmmzsave") {
      //decode
      reader.onloadend = processDecode;
    }
    else if (fileObject.name.split('.').pop() == "json") {
      //encode
      reader.onloadend = processEncode;
    }

  if (fileObject) {
    reader.readAsText(fileObject, 'utf8'); 
  }
}

function handleFileSelection(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var files = evt.dataTransfer.files;

  if (!files) {
    alert("<p>At least one selected file is invalid - do not select any folders.</p><p>Please reselect and try again.</p>");
    return;
  }

  for (var i = 0, file; file = files[i]; i++) {
    if (!file) {
      alert("Unable to access " + file.name);
      continue;
    }
    if (file.size == 0) {
      alert("Skipping " + file.name.toUpperCase() + " because it is empty.");
      continue;
    }
	  startFileRead(file);
    globalFilename = file.name;
  }
}

function jsonToZip (json) {
  //return pako.deflate(json, { to: "string", level: 1 });
  return new Promise((resolve, reject) => {
      try {
          const zip = pako.deflate(json, { to: "string", level: 1 });
          resolve(zip);
      } catch (e) {
          reject(e);
      }
  });
};

function zipToJson (zip) {
  //return pako.inflate(zip, { to: "string" });
  return new Promise((resolve, reject) => {
      try {
          if (zip) {
              const json = pako.inflate(zip, { to: "string" });
              resolve(json);
          } else {
              resolve("null");
          }
      } catch (e) {
          reject(e);
      }
  });
};

function base64ToArrayBuffer(base64) {
  let utf8Encoder = new TextEncoder();
  var bytes = utf8Encoder.encode(base64);
  return bytes;
}

function saveByteArray(reportName, byte) {
  var blob = new Blob([byte], {type: "octet/stream"});
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  var fileName = reportName;
  link.download = fileName;
  link.click();
};
