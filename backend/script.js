// Wait for the entire HTML document to be fully loaded and parsed
document.addEventListener('DOMContentLoaded', () => {
    // Initiate a fetch request to load the JSON file located at "sample/ustaxes_save_filled.json"
    fetch('sample/ustaxes_save_filled.json')
        // Once the fetch is complete, convert the response to JSON format
        .then(response => response.json())
        // When the JSON conversion is successful, execute the following callback with the parsed data
        .then(data => {
            // Get the HTML element with the ID "json-display"
            const jsonDisplay = document.getElementById('json-display');
            // Set the text content of that element to the stringified JSON data
            // The second parameter "null" and the third parameter "2" in JSON.stringify are used for formatting:
            // "null" means no custom replacer is used, and "2" specifies that the output should be indented with 2 spaces.
            jsonDisplay.textContent = JSON.stringify(data, null, 2);
        })
        // If an error occurs during the fetch or JSON conversion, log the error message to the console
        .catch(error => console.error('Error fetching JSON:', error));
});
