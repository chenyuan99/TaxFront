document.addEventListener('DOMContentLoaded', () => {
    fetch('sample/ustaxes_save_filled.json')
        .then(response => response.json())
        .then(data => {
            const jsonDisplay = document.getElementById('json-display');
            jsonDisplay.textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error('Error fetching JSON:', error));
});