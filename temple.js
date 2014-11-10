// jonathantneal's polyfill for matchesSelector
if (this.Element) {
    (function ( ElementPrototype ) {
        ElementPrototype.matches = ElementPrototype.matchesSelector =
        ElementPrototype.matchesSelector || 
        ElementPrototype.webkitMatchesSelector ||
        ElementPrototype.mozMatchesSelector ||
        ElementPrototype.msMatchesSelector ||
        ElementPrototype.oMatchesSelector ||
        function ( selector ) {
            var nodes = (this.parentNode || this.document).querySelectorAll(selector), i = -1;

            while (nodes[++i] && nodes[i] !== this);

            return !!nodes[i];
        };
    }( Element.prototype ));
}

;(function( window, document, undefined ) {

    "use strict";

    /**
     * @class Temple
     * @constructor
     * @param id {Object|String}
     * @return {Object} Temple object
     */
    var Temple = function( id ) {
        this.initVars( id );

        return this;
    };

    Temple.prototype = {
        "config": {
            "idSelector": "data-id",
            "trueSelector": "data-true",
            "falseSelector": "data-false",
            "partialSelector": "data-template",
            "leaveConditionalWrapper": true
        },

        /**
         * @method initVars
         * @param id {Object|String}
         * @return {Object} Temple object
         */
        "initVars": function initVars( id ) {

            /**
             * Get the original template
             *
             * @property original
             * @type Object
             */
            this.original = id.nodeName ? id : document.getElementByID( id );

            /**
             * Create our cloned template
             *
             * @property template
             * @type DocumentFragment
             */
            this.template = this.original.content.cloneNode( true );

            this.output = null;
            this.ready = false;

            return this;
        },

        /**
         * To fully render and return a populated template's HTML
         *
         * @method render
         * @param values {Object} The data with which to populate our template
         * @return {DocumentFragment} Constructed template fragment
         */
        "render": function render( values ) {

            /*
            First find sub-templates
            */
            if ( !this.ready ) {
                this.template = this.nestTemplates( this.template );
                this.ready = true;
            }

            /*
            Then populate all the values
            */
            this.output = this.template.cloneNode( true );
            this.output = this.populateTemplate( this.output, values );

            /*
            Lastly, clear all trues/falses
            */
            this.output = this.clearTruths();

            return this.output;
        },

        /**
         * Looks to nest partials into one template
         *
         * @method nestTemplates
         * @param parent {Object} The current parent element from which to start
         * @return parent {Object}
         */
        "nestTemplates": function nestTemplates( parent ) {

            /*
            Find the sub-templates of the provided parent selector
            */
            var self = this,
                subTemplates = parent.querySelectorAll("[" + self.config.partialSelector + "]"),
                targetTemplate = null,
                templatePartial = null,
                directParent = null;

            /*
            If there are sub templates...
            */
            if ( subTemplates.length ) {

                /*
                ...loop through them
                */
                [].forEach.call( subTemplates, function replaceWithPartial( placeholderElem ) {
                    directParent = placeholderElem.parentNode;

                    /*
                    Clone the sub template
                    */
                    targetTemplate = document.getElementById( placeholderElem.getAttribute( self.config.partialSelector ) );
                    templatePartial = targetTemplate.content.cloneNode( true );

                    /*
                    Replace our placeholder elem with the new code
                    */
                    directParent.replaceChild( templatePartial, placeholderElem );
                });

                /*
                Check the sub template for its own nested partials
                */
                return self.nestTemplates.call( self, directParent );
            }

            return parent;
        },

        /**
         * Populate the template with values
         *
         * @method populateTemplate
         * @param parent {Object} The current parent element from which to start
         * @param data {Object} The values with which to populate
         * @return template {DocumentFragment} The entire template so far
         */
        "populateTemplate": function populateTemplate( parent, data ) {
            var self = this,

                /*
                Get all temples
                */
                all = parent.querySelectorAll("[data-id], [data-true], [data-false]"),

                /*
                Get temples that are nested into other temples
                */
                exclude = self.nestedElems( all, "[data-id], [data-true], [data-false]", parent ),

                /*
                All non-nested temples
                */
                temples = self.not( all, exclude ),
                wantsTruth,
                key,
                valueExists;

            /*
            If there are any temples to populate
            */
            if ( temples.length ) {
                [].forEach.call( temples, function( elem ) {

                    /*
                    Does this want truth or false?
                    */
                    wantsTruth = self.wantsTruth( elem );

                    /*
                    Get the temple key
                    */
                    key = wantsTruth ? ( elem.getAttribute("data-true") || elem.getAttribute("data-id") ) : elem.getAttribute("data-false");

                    /*
                    Check if this value exists in the data
                    */
                    valueExists = self.checkForValue( key, data );

                    /*
                    If we're not a match...
                    */
                    if ( ( valueExists && !wantsTruth ) || ( !valueExists && wantsTruth ) ) {

                        /*
                        ...remove the element
                        */
                        self.output = self.removeElem( elem );

                    /*
                    If we are a match...
                    */
                    } else {

                        /*
                        ...add the data for the element
                        */
                        self.output = self.addData( elem, valueExists );
                    }
                });

                return self.output;
            }
            return self.output;
        },

        /**
         * Check if the elements are nested in other temple values
         *
         * @method nestedElems
         * @param elems {Object} The elements to check
         * @param selector {String} The selector string to test against
         * @param parent {Object} What element to test until
         * @return matchedElems {Array} Set of elements that are indeed nested
         */
        "nestedElems": function( elems, selector, parent ) {
            var matchedElems = [],
                traversingElem;

            /*
            We will check each element for a parent element
            that matches the selector (until the provided parent)
            */
            [].forEach.call( elems, function( elem, index ) {
                traversingElem = elem.parentNode || null;

                /*
                As long as the traversing element is not the
                body and is not yet the provided parent elem
                */
                while ( traversingElem && traversingElem !== document.body && traversingElem !== parent ) {

                    /*
                    Does it match the selector?
                    */
                    if ( traversingElem.matches( selector ) ) {

                        /*
                        Push it into an array
                        */
                        matchedElems.push( elem );

                        /*
                        Break the loop
                        */
                        return elem;
                    }

                    /*
                    Let's move one level up
                    */
                    traversingElem = traversingElem.parentNode;
                }
            });

            return matchedElems;
        },

        /**
         * Filter elements
         *
         * @method not
         * @param all {Object} All possible elements
         * @param excluded {Object} Elements to exclude
         * @return passes {Array} Elements that were not part of the excluded group
         */
        "not": function( all, excluded ) {
            var passes = [],
                isExcluded = false;

            /*
            Loop through all the provided elements
            */
            [].forEach.call( all, function( elem ) {

                /*
                Start off assuming that it is not
                to be excluded
                */
                isExcluded = false;

                /*
                Loop through the to-be-excluded elems
                */
                [].forEach.call( excluded, function( exclude ) {

                    /*
                    If they match, mark it as excluded
                    */
                    if ( elem === exclude ) {
                        isExcluded = true;
                    }
                });

                /*
                If it's not excluded, it means it passes
                */
                if ( !isExcluded ) {
                    passes.push( elem );
                }
            });

            return passes;
        },

        /**
         * Checks if the temple is looking for truth
         *
         * @method wantsTruth
         * @param elem {Object} The current temple
         * @return {Boolean}
         */
        "wantsTruth": function wantsTruth( elem ) {
            return elem.hasAttribute("data-false") ? false : true;
        },

        /**
         * Populate the template with values
         *
         * @method checkForValue
         * @param key {String} The key that we want to find in the data
         * @param values {Object} The values to check against
         * @return {Boolean|Object} Object of data corresponding to the key, otherwise `false`
         */
        "checkForValue": function checkForValue( key, values ) {
            var data,
                keyValue,
                typeOfValue,
                i;

            /*
            If the key is in the provided JSON values...
            */
            if ( values.hasOwnProperty( key ) ) {
                keyValue = values[ key ];

                /*
                Early boot if it's false
                */
                if ( keyValue === false ) {
                    return false;
                }

                /*
                Populate the data object
                */
                data = {

                    /*
                    What is the value's type?
                    */
                    "typeOf": this.typeOfValue( keyValue ),

                    /*
                    Save the actuall value to pass on
                    */
                    "keyValue": keyValue
                };

                /*
                Based on the value type, we need to check some stuff
                */
                switch ( data.typeOf ) {
                    case "array":

                        /*
                        If we have an empty array, bail
                        */
                        if ( !data.keyValue.length ) {
                            return false;
                        }

                        return data;

                    case "object":

                        /*
                        Make sure the object isn't empty
                        */
                        if ( data.keyValue != null ) {
                            for ( i in data.keyValue ) {
                                if ( data.keyValue.hasOwnProperty( i ) ) {
                                    return data;
                                }
                            }
                            return false;
                        }
                        return false;
                    default:
                        return data;
                }
            }

            return false;
        },

        /**
         * Returning the appropriate type of the value
         *
         * @method typeOfValue
         * @param value {Object|Array|String}
         * @return typeOf {String}
         */
        "typeOfValue": function typeOfValue( value ) {
            var typeOf = typeof value;

            /*
            Since arrays and objects both return as `object`,
            let's do one more check
            */
            switch ( typeOf ) {
                case "object":
                    if ( this.isArray( value ) ) {
                        typeOf = "array";
                    }
                    break;
            }
            return typeOf;
        },

        /**
         * Checking whether or not an object is actually an array
         *
         * @method isArray
         * @param arr {Object|Array}
         * @return {Boolean}
         */
        "isArray": function isArray( arr ) {
            if ( Object.prototype.toString.call( arr ) === "[object Array]" ) {
                return true;
            }
            return false;
        },

        /**
         * Remove an element
         *
         * @method removeElem
         * @param elem {Object} The element to remove
         * @return parent {Object} The parent node the element belonged to
         */
        "removeElem": function removeElem( elem ) {
            var parent = elem.parentNode;

            parent.removeChild( elem );

            return parent;
        },

        /**
         * Add data to the element
         *
         * @method addData
         * @param elem {Object} The element to populate
         * @param data {Object} Values to populate with, and what type the value is
         * @return template {DocumentFragment} The entire template so far
         */
        "addData": function addData( elem, data ) {
            switch ( data.typeOf ) {

                /*
                If we have an array, call the method we use
                to populate those
                */
                case "array":
                    this.arrays( elem, data.keyValue );
                    break;

                /*
                If we have an object, let's call the `populateTemplate`
                to check for nested temples
                */
                case "object":
                    this.populateTemplate( elem, data.keyValue );
                    break;

                case "boolean":
                    // this.

                /*
                Otherwise, it's just text
                */
                default:
                    elem.textContent = data.keyValue;
                    break;
            }
            return this.output;
        },

        /**
         * Populate the template when an array is provided
         *
         * @method arrays
         * @param elem {Object} The element to populate
         * @param data {Array} Values to populate with
         * @return newElems {DocumentFragment} Fragment of new values that we plop in
         */
        "arrays": function arrays( elem, data ) {
            var key = 0,
                valuesLength = data.length,
                newElems = document.createDocumentFragment(),
                elemCopy,
                typeOfValue;

            /*
            Looping through the array...
            */
            for ( ; key < valuesLength; key += 1 ) {

                /*
                Clone the element
                */
                elemCopy = elem.cloneNode( true );

                /*
                Get the type of value of the data in the array
                */
                typeOfValue = this.typeOfValue( data );

                if ( typeOfValue === "object" ) {
                    this.populateTemplate( elemCopy, data[key] );
                } else {
                    elemCopy.textContent = data[key];
                }
                newElems.appendChild( elemCopy );
            }
            elem.parentNode.insertBefore( newElems.cloneNode( true ), elem );
            elem.parentNode.removeChild( elem );

            return newElems;
        },

        "evaluateTruths": function evaluateTruths( parent, data ) {
            var conditionalElem = parent.querySelector("[data-true], [data-false]");

            if ( conditionalElem ) {

                var wantsTruth = this.wantsTruth( conditionalElem ),
                    key = wantsTruth ? conditionalElem.getAttribute("data-true") : conditionalElem.getAttribute("data-false"),
                    valueExists = this.checkForValue( key, data );

                if ( ( valueExists && !wantsTruth ) || ( !valueExists && wantsTruth ) ) {
                    this.output = this.removeElem( conditionalElem );

                    return this.output;
                } else {
                    this.output = this.evaluateTruths( conditionalElem, data[ key ] );

                    return this.output;
                }
            } else {
                return this.output;
            }
        },

        "clearTruths": function clearTruths() {
            var self = this,
                truths = self.output.querySelector("[data-true], [data-false]");

            if ( truths ) {
                self.output = self.removeWrapper.call( self, truths );
                return self.clearTruths();
            }
            return self.output;
        },

        "removeWrapper": function removeWrapper( elem ) {
            var parent = elem.parentNode,
                children = elem.children,
                childCount = children.length,
                newElems = document.createDocumentFragment(),
                i = 0;

            [].forEach.call( children, function( el ) {
                newElems.appendChild( el.cloneNode( true ) );
            });

            parent.insertBefore( newElems, elem );
            parent.removeChild( elem );

            return this.output;
        }
    };

    window.Temple = Temple;
}( window, document ));