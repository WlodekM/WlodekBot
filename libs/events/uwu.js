import Seed from "../seed.js";

// Code from OwO-mod (https://github.com/WlodekM/Vencord/)
const faces = [
    "(・`ω´・)",
    ";;w;;",
    "OwO",
    "UwU",
    ">w<",
    "^w^",
    "ÚwÚ",
    "^-^",
    ":3",
    "x3",
];
const exclamations = ["!?", "?!!", "?!?1", "!!11", "?!?!"];
const actions = [
    "*blushes*",
    "*whispers to self*",
    "*cries*",
    "*screams*",
    "*sweats*",
    "*twerks*",
    "*runs away*",
    "*screeches*",
    "*walks away*",
    "*sees bulge*",
    "*looks at you*",
    "*notices buldge*",
    "*starts twerking*",
    "*huggles tightly*",
    "*boops your nose*",
];
const uwuMap = [
    [/(?:r|l)/g, "w"],
    [/(?:R|L)/g, "W"],
    [/n([aeiou])/g, "ny$1"],
    [/N([aeiou])/g, "Ny$1"],
    [/N([AEIOU])/g, "Ny$1"],
    [/ove/g, "uv"],
];

let _wordsModifier, _exclamationsModifier, _spacesModifier;

export function isAt(value) {
    // Check if the first character is '@'
    const first = value.charAt(0);
    return first === "@";
}

export function isUri(value) {
    if (!value) return false;

    // Check for illegal characters
    if (
        /[^a-z0-9\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\.\-\_\~\%]/i.test(value)
    ) {
        return false;
    }

    // Check for hex escapes that aren't complete
    if (
        /%[^0-9a-f]/i.test(value) || /%[0-9a-f](:?[^0-9a-f]|$)/i.test(value)
    ) {
        return false;
    }

    // Directly from RFC 3986
    const split = value.match(
        /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
    );

    if (!split) return false;

    const [, scheme, authority, path] = split;

    // Scheme and path are required, though the path can be empty
    if (!(scheme && scheme.length && path.length >= 0)) return false;

    // If authority is present, the path must be empty or begin with a /
    if (authority && authority.length) {
        if (!(path.length === 0 || /^\//.test(path))) return false;
    } else if (/^\/\//.test(path)) {
        // If authority is not present, the path must not start with //
        return false;
    }

    // Scheme must begin with a letter, then consist of letters, digits, +, ., or -
    if (!/^[a-z][a-z0-9\+\-\.]*$/.test(scheme.toLowerCase())) return false;

    return true;
}

function uwuifyExclamations(sentence) {
    const words = sentence.split(" ");
    const pattern = new RegExp("[?!]+$");

    const uwuifiedSentence = words.map((word) => {
        const seed = new Seed(word);

        // If there are no exclamations return
        if (
            !pattern.test(word) || seed.random() > _exclamationsModifier
        ) {
            return word;
        }

        word = word.replace(pattern, "");
        word +=
            exclamations[seed.randomInt(0, exclamations.length - 1)];

        return word;
    }).join(" ");

    return uwuifiedSentence;
}

function uwuifyWords(sentence) {
    const words = sentence.split(" ");

    const uwuifiedSentence = words.map((word) => {
        if (isAt(word)) return word;
        if (isUri(word)) return word;

        const seed = new Seed(word);

        for (const [oldWord, newWord] of uwuMap) {
            // Generate a random value for every map so words will be partly uwuified instead of not at all
            if (seed.random() > _wordsModifier) continue;

            word = word.replace(oldWord, newWord);
        }

        return word;
    }).join(" ");

    return uwuifiedSentence;
}

function uwuifySentence(sentence) {
    let uwuifiedString = sentence;

    uwuifiedString = uwuifyWords(uwuifiedString);
    uwuifiedString = uwuifyExclamations(uwuifiedString);

    return uwuifiedString;
}

export function applyRules(content) {
    if (content.length === 0)
        return content;

    if (true) {
        const edgeCases = ["lmao", "will", "lol"];
        edgeCases.forEach((edgeCase, i) => {
            // if (!rule.find || !rule.replace) continue;
            content = ` ${content} `.replaceAll(edgeCase, `[$ec#${i}$]`).replace(/^\s|\s$/g, "");
        });

        content = uwuifySentence(content);

        edgeCases.forEach((edgeCase, i) => {
            // if (!rule.find || !rule.replace) continue;
            content = ` ${content} `.replaceAll(`[$ec#${i}$]`, edgeCase).replace(/^\s|\s$/g, "");
        });
    }

    content = content.trim();
    return content;
}