//Progressive Enhancements (check for service worker support)
if(navigator.serviceWorker){
    //Register SW
    navigator.serviceWorker.register('sw.js').catch(console.error);

    //sends message to clean giphy cache
    function callGiphyCacheClean(giphys){
        //get service worker registration
        navigator.serviceWorker.getRegistration().then(function(reg){
            //only post message to the currently active service worker
            if(reg.active){
                reg.active.postMessage({ action: 'cleanGiphyCache', giphys:giphys})
            }
        });
    }
}


// Giphy API object
var giphy = {
    url: 'https://api.giphy.com/v1/gifs/trending',
    query: {
        api_key: 'osPRaZoGkK7L82p5zELZysNA8bYS1xKg',
        limit: 12
    }
};

// Update trending giphys
function update() {

    // Toggle refresh state
   $('#update .icon').toggleClass('d-none');

    // Call Giphy API
    $.get( giphy.url, giphy.query)

        // Success
        .done( function (res) {

            // Empty Element
            $('#giphys').empty();

            // Populate array of latest giphys
            var latestGiphys = [];

            // Loop Giphys
            $.each( res.data, function (i, giphy) {
                // Add to latestGiphys
                latestGiphys.push(giphy.images.downsized_large.url);
                // Add Giphy HTML
                $('#giphys').prepend(
                    '<div class="col-sm-6 col-md-4 col-lg-3 p-1">' +
                        '<img class="w-100 img-fluid" src="' + giphy.images.downsized_large.url + '">' +
                    '</div>'
                );
            });

            //inform SW (if supported) of current giphys
            if( navigator.serviceWorker ) callGiphyCacheClean(latestGiphys);
        })

        // Failure
        .fail(function(){
            
            $('.alert').slideDown();
            setTimeout( function() { $('.alert').slideUp() }, 2000);
        })

        // Complete
        .always(function() {

            // Re-Toggle refresh state
            $('#update .icon').toggleClass('d-none');
        });

    // Prevent submission if originates from click
    return false;
}

// Manual refresh
$('#update a').click(update);

// Update trending giphys on load
update();
