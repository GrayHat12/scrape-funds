function extractFundList(doc, limit = 9) {
    let funds = {};
    let els = doc.querySelectorAll(`td[valign="top"]`);
    els = Array.from(els);
    els = els.filter(el => {
        let text = el.textContent.trim();
        try {
            if (text.toLowerCase().endsWith("fund")) {
                let href = el.getElementsByTagName("a")[0].href;
                if (href.length > 0) return true;
            }
            return false;
        }
        catch (err) {
            return false;
        }
    });
    els.forEach(el => {
        if (Object.keys(funds).length === limit) return;
        funds[el.textContent.trim()] = el.getElementsByTagName("a")[0].getAttribute("href").trim().substring(1);
    });
    return funds;
};

//const _regex = /[\s\n]*\d+[\s\n]*About the Funds[\s\n]*\d{4}[\s\n]*Funds[\s\n]*/gm;

function save(data) {
    if (typeof data === 'object') {
        data = JSON.stringify(data, undefined, 4);
    }
    let blob = new Blob([data], { type: 'text/json' }),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a');

    a.download = 'fundMap.json';
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
}

function main() {
    let fundMap = [];
    console.log("EXTRACTING FUND LIST");
    let doc = window.document;
    let fundLinks = extractFundList(doc);
    console.log("Fund Links : ", fundLinks);
    Object.keys(fundLinks).forEach(name => {
        let href = fundLinks[name];
        console.log("QUERYING", name);
        let fullnameParent = doc.querySelector(`p>font>b>a[name="${href}"]`).parentElement.parentElement.parentElement;
        let fullname = fullnameParent.textContent.trim();
        console.log("Scraping ", fullname);
        let paras = Array.from(doc.getElementsByTagName("p"));
        let index = paras.findIndex(x => x.textContent === fullnameParent.textContent);
        console.log("index",index);
        paras = paras.slice(index);
        console.log(paras[0].textContent, paras.length);
        let pisElStart = -1;
        let pisElEnd = -1;
        for (let i = 0; i < paras.length; i++) {
            let para = paras[i];
            if (pisElStart < 0) {
                let content = para.textContent;
                if (content.trim().toLowerCase().startsWith("principal investment strategy:")) {
                    console.log("started",para);
                    pisElStart = i;
                }
                continue;
            };
            if (pisElEnd < 0) {
                if (para.getElementsByTagName("b").length > 0) {
                    pisElEnd = i;
                    console.log("ended",para);
                }
                continue;
            };
            break;
        }
        if (pisElStart < 0 || pisElEnd < 0) {
            console.log("Failed to fetch for ", fullname, " r (", pisElStart, ",", pisElEnd, ")");
        }
        let data = "";
        paras = paras.slice(pisElStart, pisElEnd);
        for (let i = 0; i < paras.length; i++) {
            data += paras[i].textContent;
        }
        fundMap.push({
            shortName: name,
            longName: fullname,
            "Principal Investment Strategy": data.trim()
        });
    });
    console.log(fundMap);
    save(fundMap);
};

main();