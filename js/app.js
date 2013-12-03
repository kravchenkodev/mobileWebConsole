// TODO: avoid jQuery
// TODO: solved circular references
// TODO: log history

$('#console').on('click', '.collapsable > .collapsable-header', function(){
    $(this).siblings('.collapsable-body').slideToggle('fast')
    $(this).toggleClass('rotated')
})

var templates = {

        // for JS types

        'plain-property-start'           : '<li class="plain"><span class="property"> { property }</span><span class="punctuation">: </span>',
        'collapsable-property-start'     : '<li class="collapsable"><div class="collapsable-header"><i class="icon icon-chevron-right"></i> <span class="property"> { property }</span><span class="punctuation">: </span>',
        'html-collapsable-property-start': '<li class="collapsable html-value"><div class="collapsable-header"><i class="icon icon-chevron-right"></i> <span class="property"> { property }</span><span class="punctuation">: </span>',
        'property-end'                   : '</li>',
        'number'                         : '<span class="number-value">{ value }</span>',
        'string'                         : '<span class="string-value">"{ value }"</span>',
        'regexp'                         : '<span class="regexp-value">{ value }</span>',
        'null'                           : '<span class="null-value">null</span>',
        'undefind'                       : '<span class="undefind-value">undefind</span>',
        'bool'                           : '<span class="bool-value">{ value }</span>',
        'array'                          : '<span class="property array-value">Array[{ length }]</span></div><ul class="collapsable-body" style="display: none;">',
        'object'                         : '<span class="property object-value">Object</span></div><ul class="collapsable-body" style="display: none;">',
        'object-end'                     : '</ul>',
        'collapsable-start'              : '<ul class="root"><li class="collapsable"><div class="collapsable-header"><i class="icon icon-chevron-right"></i>',
        'collapsable-end'                : '</li></ul>',

        // for HTMLNodes

        'plain-node-start'      : '<li class="plain">',
        'plain-node-end'        : '</li>',
        'tag-start'             : '<span class="punctuation">&lt;</span>',
        'tag-end'               : '<span class="punctuation">&gt;</span>',
        'plain-close-tag'       : '<span class="punctuation">&lt;</span><span class="punctuation">/</span><span class="tag">{ tagName }</span><span class="punctuation">&gt;</span>',
        'tag-name'              : '<span class="tag">{ tagName }</span>',
        'tag-attr'              : ' <span class="attr-name">{ attrName }=</span><span class="punctuation">"</span><span class="attr-value">{ attrValue }</span><span class="punctuation">"</span>',
        'tag-content'           : '<span class="tag-content">{ tagContent }</span>',
        'collapsable-tag-start' : '<li class="collapsable"><div class="collapsable-header"><i class="icon icon-chevron-right"></i>',
        'collapsable-open-node' : '</div><ul class="collapsable-body"  style="display: none;">',
        'collapsable-close-node': '<li class="plain close-tag"><span class="punctuation">&lt;</span><span class="punctuation">/</span><span class="tag">{ tagName }</span><span class="punctuation">&gt;</span></li>',
        'collapsable-tag-end'   : '</ul></li>'
    }

var toString = Object.prototype.toString

function isArray(value){
    return toString.call(value) == '[object Array]'
}

function isObject(value){
    return toString.call(value) == '[object Object]'
}

function isFunction(value){
    return toString.call(value) == '[object Function]'
}

function isNumber(value){
    return toString.call(value) == '[object Number]'
}

function isString(value){
    return toString.call(value) == '[object String]'
}

function isRegExp(value){
    return toString.call(value) == '[object RegExp]'
}

function isBool(value){
    return toString.call(value) == '[object Boolean]'
}

function isNull(value){
    return toString.call(value) == '[object Null]'
}

function isUndefind(value){
    return toString.call(value) == '[object Undefined]'
}

function isElement(value) {
    return value && value.nodeType === 1
}

function isPlainElement(value){
    return !(value.hasChildNodes() && (isElement(value.firstChild) || isElement(value.lastChild)))
}

function compile(template, data) {
    return !template ? '' : new Function("_",
      "return '" + template
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/'/g, "\\'")
        .replace(/\{\s*(\w+)\s*\}/g, "'+(_.$1?(_.$1+'').replace(/&/g,'&amp;').replace(/\"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):(_.$1===0?0:''))+'") +
      "'"
    )(data);
}

function render(value){
    var view = ''

    if(isArray(value) || isObject(value)){
        return [
            templates['collapsable-start'],
            renderValue(value),
            templates['collapsable-end']
        ].join('')
    }
    else if(isElement(value)){
        return [
            '<ul class="html-value">',
            renderNodeElement(value),
            '</ul>'
        ].join('')
    }
    else {
        return renderPrimitive(value) + '</br>'
    }
}

function renderValue(value){
    if(isArray(value)){
        return renderArray(value)
    }
    else if (isObject(value)){
        return renderObject(value)
    }
    else if(isElement(value)){
        return renderNodeElement(value)
    }
    else {
        return renderPrimitive(value)
    }
}

function renderProperty(property, value){
    if(isArray(value) || isObject(value)){
        return [
            compile(templates['collapsable-property-start'], { property: property }), 
            renderValue(value), 
            templates['property-end']
        ].join('')
    }
    else if(isElement(value)){
        if(isPlainElement(value)){
            return [
                compile(templates['plain-property-start'], { property: property }), 
                renderTag(value),
                compile(templates['plain-close-tag'], {tagName: value.localName}), 
                templates['property-end']
            ].join('')
        }
        else {
            return [
                compile(templates['html-collapsable-property-start'], { property: property }), 
                renderNodeElement(value, true), 
                templates['property-end']
            ].join('')
        }
    }
    else {
        return [
            compile(templates['plain-property-start'], { property: property }), 
            renderValue(value), 
            templates['property-end']
        ].join('')
    }
}

function renderArray(array){
    var view = ''

    view += compile(templates['array'], array)

    for(var i = 0, l = array.length; i < l; i++){
        view += renderProperty(i, array[i])
    }

    view += templates['object-end']

    return view 
}

function renderObject(object){
    var view = ''

    view += templates['object']

    for(var i in object){
        if(object.hasOwnProperty(i)){
            view += renderProperty(i, object[i])
        }
        else {
            
        }
    }

    view += templates['object-end']
    
    return view
}

function renderPrimitive(value){
    switch(true){
        case isNumber(value)  : return compile(templates['number'], {value : value})
        case isRegExp(value)  : return compile(templates['regexp'], {value : value})
        case isBool(value)    : return compile(templates['bool'], {value : value})
        case isFunction(value): return value.toString().replace(/\n/gi, '').replace(/\{.+\}/, '{ ... }')
        case isNull(value)    : return templates['null']
        case isUndefind(value): return templates['undefind']

        default               : return compile(templates['string'  ], {value : value.toString()})
    }
}

function renderNodeElement(value, likeProperty){
    var view = ''

    if(!isPlainElement(value)) {
        if(!likeProperty){
            view += templates['collapsable-tag-start']
        }
        view += renderTag(value)
        view += templates['collapsable-open-node']
        for(var i = 0, l = value.childNodes.length; i < l; i++){
            if(isElement(value.childNodes[i])){
                view += renderNodeElement(value.childNodes[i])
            }
        }
        view += compile(templates['collapsable-close-node'], {tagName: value.localName})
        view += templates['collapsable-tag-end']
        return view
    }
    else {
        return [
            templates['plain-node-start'],
            renderTag(value),
            compile(templates['plain-close-tag'], {tagName: value.localName}),
            templates['plain-node-end']
        ].join('')
    }
}

function renderTag(value){
    return [
        templates['tag-start'],
        compile(templates['tag-name'], { tagName: value.localName }),
        renderAttrs(value),
        templates['tag-end'],
        compile(templates['tag-content'], { tagContent: value.firstChild && value.firstChild.nodeValue })
    ].join('')
}

function renderAttrs(value){
    var attrs = value.attributes || [],
        view = ''

    for(var i = 0, l = attrs.length; i < l; i++){
        view += compile(templates['tag-attr'], { attrName: attrs[i].name, attrValue: attrs[i].value })
    }

    return view
}

function Console(){
    this.$el = $('#console')
}

Console.prototype.log = function(value){
    this.$el.append(render(value))
    log(value)
}

var log = console.log.bind(console)

var console = new Console()

console.log({
    property1: 42,
    property2: 'strings',
    property3: {
        property4: [123, 1321, null, true],
        regexp: /\s+/gi
    }
})
console.log(42)
console.log(document.getElementById('console'))
console.log($('#console'))


var ds = [{
    property1: 42,
    property2: 'string',
    property3: [{
        0: 'ewre',
        1: null,
        2: true
    }]
}]
