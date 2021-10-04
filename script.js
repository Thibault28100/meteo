// Ci dessous une syntaxe de commentaire "JS Doc". Si votre éditeur de texte / IDE le permet,
// Au survol de la souris sur la fonction, ces mêmes information seront affichées, à n'importe
// quel endroit dans le code où cette fonction figure.

/**
 * @type string
 * @description
 * Cette variable stock le contenu de la barre de recherche. Vu son placement, elle est accessible
 * n'importe où dans le fichier "script.js"
 */
let search;

// Ajout d'un "event listener" sur la barre de recherche.
// Exécute la fonction fetchCityList() lorsqu'on arrête d'appuyer sur une touche
$("#search-bar").on("keyup", fetchCityList);

// Ajout d'un "event listener" sur le select
// Exécute la fonction fetchCityWeather() à la sélection d'un nouvel élément
$("#city-selector").on("change", fetchCityWeather);

// Evénements possibles pour la méthode "on()" :
// - "keydown" : à la pression d'une touche
// - "keyup" : à l'arrêt de la pression d'une touche
// - "change" : au changement de l'élément
// - "click" : Au clic
// - "dbclick" : au double-clic
// - "mouseenter" : à l'entrée de la souris dans l'élément
// - "mouseleave" : à la sortie de la souris de l'élément

// Cas spécial : $(document).ready()
// Dés que la page est chargée


/**
 * @description
 * Cette fonction lance la recherche d'une ville dans Geo Api FR.
 * Le contenu de le champ de recherche sera récupéré et analysé. Si il est considéré
 * que le contenu est assez fourni et conforme, l'appel à l'API Geo API sera fait.
 * Au retour de Geo API, la fonction refreshCitySelector() sera exécutée.
 *
 * Est accepté : des mots de plus d'un caractère et les codes postaux
 * 
 * N'est pas retenu : une recherche sur un seul caractère, les caractères spéciaux
 * seuls, les chiffres (hors codes postaux).
 *
 * @returns {null | void} Interruption de la fonction avec null si recherche inadéquate.
 */
function fetchCityList() {
    // Mise à jour de la variable search avec la nouvelle valeur dans la barre de recherche
    search = $("#search-bar").val();

    // On vide le select en préparation au recueil de nouveaux éléments
    $("#city-selector").empty();

    // Si il n'y a qu'une lettre ou seuls des caractères spéciaux sont entrés, on arrête la fonction
    if(search.length < 1 || !search.match(/\w/g)) {
        return null;
    }

    // Début de préparation de l'URL pour Geo API FR
    let url = "https://geo.api.gouv.fr/communes?";

    // Si la longueur de l'entrée dans la barre de recherche est égale à 5 et si c'est un nombre
    // On ajoute ce qui y a été entré en tant que code postal
    if(search.length == 5 && !isNaN( parseInt(search) )) {
        url += "codePostal=" + search;
    }
    // Si c'est du texten on entre ce qui a été mis dans la barre de recherche en tant que nom de ville
    else if(isNaN( parseInt(search) )) {
        url += "nom=" + search;
    }
    // Sinon (ce serait un chiffre ne correspondant pas à un code postal), on arrête la fonction
    else {
        return null;
    }

    // Exécution de la requête à Géo API FR avec l'URL préparée, utilisation de refreshCitySelector() comme callback
    $.get(url).done( refreshCitySelector );

}

/**
 * @param {Object[]} response
 *
 * @description
 * Suite à l'appel AJAX à Geo API FR, cette fonction sera appellée pour gérer le retour de Geo API FR.
 * La liste des villes retounée sera incorporée au select sous forme de balise option pour chaque ville.
 * Le code INSEE sera stocké dans la valeur de la balise option et le texte montrera le département et
 * le nom de la ville.
 *
 * Si il y a plus de 12 villes il n'y aura pas d'insertion dans la balise select. On considère qu'il faut donner
 * plus de précison dans le champ de recherche. Si on recherche un code postal, on considère qu'on affiche quand
 * même les résultats, même si il y en a plus de 12.
 *
 * Si jamais un nom de ville complet est entré (insensible à la casse), on insère de toute manière cette ville. 
 */
function refreshCitySelector(response) {

    // Si il y a moins de 12 villes ou si un nombre (donc un code postal) est recherché :
    if( response.length < 12 || !isNaN( parseInt(search) ) ) {
        // On ajoute chaque ville au select avec append()
        for(let i = 0 ; i < response.length ; i++) {
            $("#city-selector").append(`
                <option value="${response[i].code}">${response[i].codeDepartement} - ${response[i].nom}</option>
            `)
        }
        // On actualise la météo pour le nouvel élément courrant après peuplement du select
        fetchCityWeather();
    }
    // Nous avons besoin que si un nom de ville a été exactement entré mais qu'il y a plus de 12 villes possibles,
    // Nous ayons quand même la ville elle-même entrée dans le select.
    else {
        // Utilisation de la méthode filter() des tableau. Le filtre appliqué est dans la fonction filterOnSearch()
        // Seul les éléments qui passent le test resteront dans le tableau.
        response = response.filter( filterOnSearch );

        // On ajoute les éléments au select si jamais on a au moins un élément dans le tableau
        if(response.length > 0) {
            for(let i = 0 ; i < response.length ; i++) {
                $("#city-selector").append(`
                    <option value="${response[i].code}">${response[i].codeDepartement} - ${response[i].nom}</option>
                `)
            }
            // On actualise la météo pour le nouvel élément courrant après peuplement du select
            fetchCityWeather();
        }
    }

}

/**
 * @param {Object} city
 * Element du tableau d'une réponse de Geo API FR lors d'une recherche de ville par code postal ou nom.
 *
 * @description
 * Fonction donnée au filtre appriqué à la liste des villes depuis la fonction refreshCitySelector(). 
 * La ville sera gardée dans la liste des villes si son nom est égal à ce qui est entré dans le champ de
 * recherche. 
 *
 * Le filtre est rendu insensible à la casse grâce à l'utilisation de toLowerCase() (une méthode du type string,
 * chaîne de caractère) sur les deux noms de villes.
 *
 * @returns {boolean} Validation pour le filtre
 */
function filterOnSearch(city) {
    return city.nom.toLowerCase() == search.toLowerCase();
}

/**
 * @description
 * Cette fonction récupére le code INSEE correspondant à une ville depuis le select, fait une recherche dans
 * Geo API FR, puis lance les fonctions fetchCurrentWeather() et fetchForecastWeather() en leur transmettant
 * les données correspondant à la ville.
 */
function fetchCityWeather() {
    // On stock le code INSEE stocké dans la "value" de l'option sélectionnée
    const codeInsee = $("#city-selector").val();

    // Demande des information d'une ville à Géo API FR selon code INSEE,
    // Utilisation de fetchCurrentWeather() et fetchForecastWeather() comme callbacks
    $.get("https://geo.api.gouv.fr/communes/" + codeInsee)
    .done( fetchCurrentWeather )
    .done( fetchForecastWeather );
}

/**
 * @param {Object} response
 * Réponse de Geo API FR d'une recherche sur code INSEE
 *
 * @description
 * Cette fonction renseigne un appel à Open Weather pour la météo actuelle avec les données de Geo API FR pour
 * une requête plus précise. Une fois la réponse arrivée, la fonction refreshCurrentWeather()  sera lancée
 * avec la réponse de Open Weather.
 */
function fetchCurrentWeather(response) {
    $.get(
        "http://api.openweathermap.org/data/2.5/weather?"
        + "q=" + response.nom + ",fr" 
        + "&zip=" + response.codesPostaux[0] + ",fr"
        + "&units=metric&appid=d4e017c94e5b4b6b7cd881d51b5dfe1c"
        + "&lang=fr"
    ).done( refreshCurrentWeather )
    
}

/**
 * @param {Object} response
 * Réponse de Open Weather pour une demande de météo actuelle.
 *
 * @description
 * Cette fonction est éxécutée dés que Open Weather apporte une réponse.
 *
 * le corps du site sera montré et les données de la météo actuelle seront incorporées dans la carte (bootstrap)
 * prévue à cet effet.
 */
function refreshCurrentWeather(response) {
    // un attribut style="display: none;" avait été mis sur la div avec ID "meteo". removeAttr("style") va
    // supprimer l'attribut "style" et montrer ce qui est entre la div.
    $("#meteo").removeAttr("style");

    // On répartit les informations récupérées de Open Weather
    $("#city-name").text(response.name);
    $("#current-weather").text(response.weather[0].description);
    $("#current-weather-icon").attr("src", "http://openweathermap.org"
    + "/img/wn/" + response.weather[0].icon + "@2x.png");
    $("#current-temp").text(response.main.temp + " °C");

}

/**
 * @param {Object} response
 * Réponse de Geo API FR d'une recherche sur code INSEE
 *
 * @description
 * Cette fonction renseigne un appel à Open Weather pour la météo future avec les données de Geo API FR pour
 * une requête plus précise. Une fois la réponse arrivée, la fonction refreshForecastWeather() sera lancée
 * avec la réponse de Open Weather.
 */
function fetchForecastWeather(response) {
    
    $.get(
        "http://api.openweathermap.org/data/2.5/forecast?"
        + "q=" + response.nom + ",fr" 
        + "&zip=" + response.codesPostaux[0] + ",fr"
        + "&appid=d4e017c94e5b4b6b7cd881d51b5dfe1c&units=metric&lang=fr",
        refreshForecastWeather
        );

}

/**
 * @param {Object} response
 * Réponse de Open Weather pour une demande de météo future (toutes les 3 heures sur 5 jours).
 *
 * @description
 * Cette fonction est éxécutée dés que Open Weather apporte une réponse.
 *
 * Les cartes (bootstrap) contenues dans la partie météo future (ID "forecast") seront effacées puis remplacées par de
 * nouvelles cartes (bootstrap).
 */
function refreshForecastWeather(response) {
    // On supprime tout ce qui est contenu dans la div à l'ID "forecase" en prévision de l'accueil de nouveaux éléments
    $("#forecast").empty();

    // On ajoute de nouveaux éléments dans "forecast" selon la liste donnée par Open Weather.
    for(let i = 0 ; i < response.list.length ; i++) {
        $("#forecast").append(`
            <div class="card forecast-card px-0 col-lg-2 col-md-4 m-1">
                <div class="card-header text-center">${new Date(response.list[i].dt * 1000).toLocaleString()}</div>
                <img src="http://openweathermap.org/img/wn/${response.list[i].weather[0].icon}@2x.png" class="card-img-top" />
                <div class="card-body">
                    <h5 class="card-title text-center">${response.list[i].weather[0].description}</h5>
                    <h6 class="card-subtitle text-muted text-center">${response.list[i].main.temp} °C</h6>
                </div>
            </div>
        `);
    }
}


// $.get({
//     url: "https://api.pexels.com/v1/search?query=cat&per_page=5&page=2",
//     headers : {
//         Authorization: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
//     }
// }).done( (response) => {
//     console.log(response);
// })

