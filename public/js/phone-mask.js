// Add jQuery Mask Plugin
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js';
document.head.appendChild(script);

// Wait for jQuery and Mask plugin to load
script.onload = function() {
    $(document).ready(function() {
        // Apply mask to phone input fields
        $('input[type="tel"]').mask('(00) 00000-0000', {
            placeholder: '(00) 00000-0000'
        });
    });
};