import fs from "fs"

export function parseHtms(req, res, file) {
    let template = fs.readFileSync(String(file))
    const dictionary = {
        "DATE": (() => {
            return new Date()
        }),
        "PATH": (() => {
            return req.path
        }),
        "URL": () => {
            return req.url
        }
    }
    let content = String(template)

    let lib = fs.readFileSync("www/standardLib.htms")

    content = content.replaceAll("<include@sLib />", lib)

    const regex = {
        include: /<include@([^>\s]+(?:\s[^>]+)*)\s*\/>/g,
        ss: /<ss>([\s\S]*?)<\/ss>/g,
        api: /<api path="(.*?)">([\s\S]*?)<\/api>/g,
        apiHelper: /<\#([\s\S]*?)>/g
    }

    content = content.replace(regex.include, (match, group) => {
        try {
            // Evaluate the code inside <!--include@--> tags
            const result = fs.readFileSync(group);
            return `<!-- HTMLS - Included code from ${group} -->\n${result}\n<!-- HTMLS - End included code -->`;
        } catch (error) {
            // If there's an error during evaluation, return the original match
            console.error(`Error including code: ${group}\nError: `, error);
            return match+`<script>console.error("Could not include ${group}", "${String(error).replaceAll("\n", "\\n")}")</script>\n<!--Inclusion error-->\n<!--${error}-->`;
        }
    });

    // content = content.replaceAll("{[CONTENT]}", response)
    for (const key in dictionary) {
        if (!Object.hasOwnProperty.call(dictionary, key)) continue;
        const element = dictionary[key];
        content = content.replaceAll(`<@${key}>`, element())
    }

    // console.log(content)

    content = content.replace(regex.ss, (match, group) => {
        try {
            // Evaluate the code inside <!--$...$--> tags
            const result = eval(group);
            const sanitizedResult = result !== undefined ? String(result) : '';
            return sanitizedResult;
        } catch (error) {
            // If there's an error during evaluation, return the original match
            console.error(`Error evaluating code: ${group}\nError: `, error);
            return match;
        }
    });

    // Finding all matches in the string
    const matches = content.matchAll(regex.api);

    // Logging the extracted values
    for (const match of matches) {
        const APIpath = match[1];
        const code = match[2];
        console.log(APIpath)
        s.api[`${req.path.replace("/", "")}-${APIpath}`] = code
        content = content.replace(match[0], `<!-- API endpoint definition here (${req.path.replace("/", "")}-${APIpath}) -->\n<!--\n${code}\n-->`);
    }

    content = content.replace(regex.apiHelper, (match, group) => {
        try {
            // Evaluate the code inside <%--...--%> tags
            const result = `${req.path.replace("/", "")}-${group}`;
            const sanitizedResult = result !== undefined ? String(result) : '';
            return sanitizedResult;
        } catch (error) {
            // If there's an error during evaluation, return the original match
            console.error(`Error evaluating code: ${group}\nError: `, error);
            return match;
        }
    });
    
    //     try {
    //         // Evaluate the code inside %{...} brackets
    //         console.log(code, match)
    //         const result = eval(code);
    //         return result !== undefined ? result : match;
    //     } catch (error) {
    //         // If there's an error during evaluation, return the original match
    //         console.error(`Error evaluating code: ${code}`);
    //         return match;
    //     }
    // });
    return content
}