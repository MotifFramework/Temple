var config = {},
    template,
    temple;

QUnit.module( "Temple Truths", {
    setup: function() {
        config = {
            "data": {
                "person": false,
                "persons": []
            },
            "dataAlt": {
                "person": true
            }
        };
        template = document.getElementById("template-truth");
        temple = new Temple(template);
    },
    teardown: function() {
        config = {};
        template = null;
        temple = null;
    }
});
QUnit.test( "Temple template analysis", function( assert ) {
    var truths = temple.template.querySelectorAll("[data-true], [data-false]");

    assert.ok( temple, "The Temple instance has cloned the template.");
    assert.equal( truths.length, 1, "There is only 1 truth Temple in this template.");
});
QUnit.test( "Temple truths", function( assert ) {
    var render = temple.render( config.data ),
        renderAlt = temple.render( config.dataAlt );

    assert.ok( !temple.checkForValue("person", config.data), "The object key 'person' is false.");
    assert.ok( !temple.checkForValue("persons", config.data), "The array 'persons' is false because it's empty.");
    assert.equal( render.textContent.trim(), "Shown.", "The Temple truth was not matched, so the conditional is not shown.");
    assert.equal( renderAlt.querySelectorAll("[data-true]").length, 0, "The wrapper of a truth has been removed.");
});

QUnit.module( "Nested Templates", {
    setup: function() {
        config = {
            "names": [
                {
                    "name": {
                        "pass": "Jamie",
                        "link": "URL!"
                    }
                },
                {
                    "name": {
                        "pass": "Joffrey"
                    }
                }
            ]
        };
        template = document.getElementById("template-names");
        temple = new Temple(template);
    },
    teardown: function() {
        config = {};
        template = null;
        temple = null;
    }
});
QUnit.test( "Nested Temples", function( assert ) {

    var output = temple.nestTemplates( temple.template ),
        nestedElem = output.querySelector("[data-id='pass']"),
        templatePlaceholder = output.querySelectorAll("[data-template]");

    assert.ok( nestedElem, "The nested temple's element has been brought into the parent temple.");
    assert.equal( templatePlaceholder.length, 0, "There are no leftover nested Temple placeholders.");
});
QUnit.module( "Arrays", {
    setup: function() {
        config = {
            "repo": [
                "resque",
                "hub",
                "rip"
            ]
        };
        template = document.getElementById("template-arrays");
        temple = new Temple(template);
    },
    teardown: function() {
        config = {};
        template = null;
        temple = null;
    }
});
QUnit.test( "Arrays", function( assert ) {
    var repos = temple.arrays(temple.template.querySelector("[data-id='repo']"), config.repo);

    assert.equal( repos.querySelectorAll("[data-id='repo']").length, 3, "There are three iterations of the `repo` data ID.");

});
QUnit.module( "Attributes", {
    setup: function() {
        config = {
            "heading": {
                "@": {
                    "class": "secondary-heading"
                },
                "html": "District 5"
            },
            "paragraph": "It's not worth winning if you can't win big.",
            "list": {
                "@": {
                    "class": "unordered mtn",
                    "data-coach": "bombay"
                },
                "list-item": [
                    "Averman",
                    {
                        "@": {
                            "class": "even"
                        },
                        "html": "Conway"
                    },
                    "Goldberg",
                    {
                        "@": {
                            "class": "even"
                        },
                        "html": "Hall"
                    }
                ]
            }
        };
        template = document.getElementById("template-attributes");
        temple = new Temple(template);
    },
    teardown: function() {
        config = {};
        template = null;
        temple = null;
    }
});
QUnit.test( "Attributes Present", function( assert ) {
    var render = temple.render( config );
    console.log(render);

    assert.ok( render.querySelector("[data-id='heading']").hasAttribute("class"), "The heading has successfully received the 'class' attribute.");

});

// Test arrays
// Test child objects
// Test attributes
// Make sure it's an actual template