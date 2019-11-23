// UI CONTROLERS

$("#search-button").click(()=>{
    startSearch()
});

$(document).keyup(function(event) {

    if ($("#search-bar").is(":focus")) {
        $("#no-result").css("display","none")
    }

    if ($("#search-bar").is(":focus") && event.key == "Enter") {
        startSearch()
    }
});

function startSearch(){
    var research = $("#search-bar").val();
    var url = `index.html?query=${research}`
    history.pushState(null, null, url);
    searchBarFunction(research);
}

// Loader 
$(window).on('load', function() {
    // PAGE IS FULLY LOADED  
    // FADE OUT YOUR OVERLAYING DIV
    $("#overlay").fadeOut();
    var url = new URL(window.location);
    var query = url.searchParams.get("query");

    if (query !== null) {
        document.getElementById("search-bar").value = query 
        startSearch()
    }

 });

function dessertOnLoad(){
     var url = new URL(window.location);
     var uri = "http://dbpedia.org/resource/"+ url.searchParams.get("URI");
     getFullInfos(uri);
     searchSimilarDesserts(uri,displaySuggestions);
}

// DISPLAY CONTROL
// function getFullInfos(URI) {
//     result = {
//         name : "dessertName" ,
//         imgURL : "http://www.zdraveovocie.sk/wp-content/uploads/2017/06/ananas.png",
//         description : "descriptionDessert", 
//         ingredients : ["ingredient1","ingredient2","ingredient3"],
//         country : "countryName"
//     };
//     displayInfos(result);
// }

function displayInfos(infos) {
    var source = $("#ingredient-template").html();
    var template = Handlebars.compile(source);

    var sourceDetails = $("#ingredient-description-template").html();
    var templateDetails = Handlebars.compile(sourceDetails);


    $("#img-food").attr("src",infos.imgURL);
    $("#name-food").text(infos.name);
    $("#description").text(infos.description);
    $("#country-name").text(infos.country);
    $("#country-name").attr("href", "index.html?query="+infos.country)
    
    
    var ingredientsNames = []
    var ingredientsDetails = []

    infos.ingredients.forEach( ingredient => 
        {   
            var splitURI = ingredient.URI.split('/')
            var id = splitURI[splitURI.length - 1] 
            var urlToInsert = "index.html?query=" + id
            var description = ingredient.description

            var cardLine = template(
                {
                    // url: urlToInsert,
                    id: id.replace(/\(/g,"").replace(/\)/g,""),
                    name_ingredient : ingredient.name,
                    description : (description.length >= 50) ? (description.substring(0, 50) + '...') : description
                }
            )
            ingredientsNames.push(cardLine)

            var cardDetails = templateDetails(
                {
                    id: id.replace(/\(/g,"").replace(/\)/g,""),
                    img: ingredient.imgURL,
                    url: urlToInsert,
                    name_ingredient : ingredient.name,
                    description : (description.length >= 100) ? (description.substring(0, 100) + '...') : description
                }
            )
            ingredientsDetails.push(cardDetails)
            // Old version, deprecated
            // newElm = $(document.createElement("li"));
            // newElm.attr("class","list-group-item").text(ingredient);
            // $("#ingredients").append(newElm);
        });

    // resultDiv = $("#ingredients")
    if (ingredientsNames.length != 0){
        $("#ingredients").html(ingredientsNames.join(" "))
    }
    if (ingredientsDetails.length != 0){
        $("#ingredient-details").html(ingredientsDetails.join(" "))
    }

    $("#overlay").fadeOut();
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })

}

function printIngredientsDetails(name) {
    $("#ingredient-details").css("display","flex")
    $(".details-ingredient").css("display","none")
    $("#"+name).css("display","block")
}

function displaySearchbarResult(cardsInfo){
    var source   = $("#searchbar-result-template").html();
    var template = Handlebars.compile(source);
    var resultCards = []
    for(var category in cardsInfo){
        cardsInfo[category].forEach(card => {
            if (card !== undefined){
                card['description'] = (card['description'].length >= 100)?(card['description'].substring(0,100)+'...') : card['description'];     
            var cardCompiled = template(
                {
                    uri : card['uri'],
                    link_image : card['imgURL'],
                    title_dessert : card['name'],
                    description_dessert : card['description']
                }
            )
            resultCards.push(cardCompiled)
            }   
        })
    }
    resultDiv = $("#results-list")
    if (resultCards.length != 0){
        resultDiv.css("display","block")
        resultDiv.html(resultCards.join(" "))
    }
    else{
        resultDiv.css("display","none")
    }
}

// takes the string line of research
const prefixUri = "http://dbpedia.org/resource/"
function searchBarFunction(searchText){

    if($("#suggestion") != null) {
        $("#suggestion").remove();
    }

    $("#loading-results").css("display","block")
    $("#loading-results").fadeIn();

    if($("#dropdownMenuButton").text() === "Dessert Dictionary"){
        // get uris from search text thanks to URIList
        var URIList = JSON.parse(sessionStorage.getItem("URIList"));
        var found = URIList.find(element => {
            return element[0] === searchText.replace(/ /g,"_");
        })
        if(found != null || found !== undefined) {
            var dictUri = {};
            dictUri[found[1]] = found[0]
            researchData(dictUri);
            return;
        }
    }
    // get uris from search text with DBPedia-Spotlight
    searchAllUri(searchText).then(dictUri => {
        if(Object.getOwnPropertyNames(dictUri).length === 0){
            $("#loading-results").fadeOut();
            $("#no-result").css("display","block")
            //todo: show error message 
        } else {
            researchData(dictUri);
        }
    })
}

function researchData(dictUri) {
// TODO discuss hypothese : every list is 0/1
    var dataByCategory = {}
    var getInfoPromisesCat = {}
    for(var category  in dictUri){
        var URI = prefixUri + dictUri[category]
        dataByCategory[category] = []
        switch(category){
            case 'dessert':
                getInfoPromisesCat[category] = getMinInfos(URI)
                break
            case 'country':
                getInfoPromisesCat[category] = getDessertFromCountry(URI)
                break
            case 'ingredient':
                getInfoPromisesCat[category] = getDessertFromIngredient(URI)
                break
        }
    }
    Promise.all(Object.keys(getInfoPromisesCat)
        .map(category => {
            return getInfoPromisesCat[category].then(
                desserts => {
                    if (Array.isArray(desserts)){
                        for(index in desserts){
                            dataByCategory[category].push(desserts[index])
                        }
                    }
                    else{
                        dataByCategory[category].push(desserts)
                    }
                })
        })
    ).then(() => {

        $("#loading-results").fadeOut();
        displaySearchbarResult(dataByCategory)}
    )
}

// 
function displaySuggestions(cardsInfo,type, similarInfo){
    var source   = $(`#suggestion-${type}-template`).html();
    var template = Handlebars.compile(source);
    var resultCards = [];

    cardsInfo.forEach((card, index) => {
        if (card !== undefined)
        {
            card['description'] = (card['description'].length >= 100)?(card['description'].substring(0,100)+'...') : card['description'];  
            var cardContent = {
                img_dessert : card['imgURL'],
                name_dessert : card['name'],
                link_dessert : 'dessert.html?URI='+card['uri']
            }   

            // TODO : get the missing informations for suggestions
            switch (type) {
                case "ingredient":
                    var commonIng = similarInfo[1][index]
                        .substring(similarInfo[1][index].lastIndexOf("/")+1)
                        .replace(/_/g," ").replace(/\(.*\)/g,"");
                    cardContent.description_dessert = `${commonIng} and ${similarInfo[0][index]} other` // The common ingredient
                    break;
                case "country":
                    cardContent.description_dessert = similarInfo[index]
                        .substring(similarInfo[index].lastIndexOf("/")+1)
                        .replace(/_/g," "); // The common country, not implemented in getMinInfos
                    break;
                case "dessert":
                    cardContent.description_dessert = similarInfo[index] // The common country 
                    break;
                default:
                    break;
            }

        var cardCompiled = template(cardContent)
        resultCards.push(cardCompiled) 
        }   
    });

    resultDiv = $(`#suggestion-${type}`)
        resultDiv.html(resultCards.join(" "))
}