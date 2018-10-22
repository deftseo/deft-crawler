var crawler = require('../').Crawler();
var fs = require('fs');
var startUrl = 'https://sivers.org/book';
var filename = "sivers-summaries.txt";
var bookDoc = "sivers-summaries.json";
var bookHtml = "sivers-summaries.html";
var bookText = "sivers-summaries.txt";

var books = [];
var buffer = [];

function parseMetatext(metatext) {
    var meta = {};
    var i, max, pair, name, value;

    for (i=0, max=metatext.length; i < max; i++) {
        pair = metatext[i].split(":");
        if (pair.length === 2) {
            switch (pair[0].trim()) {
                case 'ISBN':
                case 'Date read':
                    name = pair[0].trim();
                    break;
                case 'How strongly I recommend it':
                    name = 'Rating';
                    break;
                default: null;
            }

            if (name) {
                meta[name] = pair[1].trim();
            }
        }
    }

    return meta;
}



crawler
    .startUrl(startUrl)
    .follow(function(nextUrl, fromUrl) {
        return (
            crawler.isStartDomain(nextUrl)
            && nextUrl.match(/\/book\/.+/)
        );
    })
    .on('page', function(link, $page) {
        var book = {};
        console.log("[PAGE-]", link.href);
        
        if (link.href.match(/\/book\/.+/)) {
            var title = $page('#content h1').text().trim();
            var metatext = $page('#content h1+small').text().trim().split("\n");
            var metadata = parseMetatext(metatext);
            var coverImage = $page('#content figure a img').attr('src');
            var amazonLink = $page('#content figure a').attr('href');
            var summary = $page('#content p#booksummary').text().trim();
            var notes = $page('#content p#booknotes').text().trim();

            book = {
                title: title,
                link: link.href,
                coverImage: coverImage,
                amazonLink: amazonLink,
                metadata: metadata,
                summary: summary,
                notes: notes
            },

            // console.log("Book:", book);

            books.push(book);
            // buffer.push($page('#content').html());
        }
    })
    .on('end', function() {
        console.log("[-END-] " + books.length + " books exported.");
        saveBooksDoc(books, bookDoc);
        saveBooksText(books, bookText);
    });


function saveBooksDoc(books, filename) {
    fs.writeFileSync(filename, JSON.stringify(books, null, 4), 'utf-8');
}

function saveBooksText(books, filename) {
    var buffer = [
        "Derek Siver's Book notes",
        "\n================================================================\n"
    ];

    for (var i=0, j=books.length; i<j; i++) {
        var book = books[0];
        buffer.push("Title: " + book.title);
        buffer.push("Link: " + book.link);
        buffer.push("Cover image: " + book.coverImage);
        buffer.push("ISBN: " + book.metadata['ISBN']);
        buffer.push("Date read: " + book.metadata['Date read']);
        buffer.push("Rating: " + book.metadata["Rating"]);
        buffer.push("\nSummary:\n--------\n\n" + book.summary);
        buffer.push("\nNotes:\n------\n\n" + book.notes);

        buffer.push("\n================================================================\n");
    }

    fs.writeFileSync(filename, buffer.join("\n"), 'utf-8');
}
