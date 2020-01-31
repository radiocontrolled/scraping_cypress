/* eslint-disable no-undef */

const searchTerms = ["Public safety"];

describe("The https://data.brla.gov/ search page", () => {
  searchTerms.forEach(tag => {
    const hrefs = [];

    it.only(`is scraped for ${tag} data`, () => {
      // the baseUrl is set in cypress.json,
      // so this line visits the path https://data.brla.gov/browse
      cy.visit(`browse`);

      // gets the 3rd input element on the page
      // this element is where the user enters their search term
      cy.get("input")
        .eq(2)
        // enters the search term and presses `enter`
        .type(`${tag}{enter}`);

      // wait for an arbitrary amount of time
      cy.wait(1000);

      // data.brla.gov searches have paginated results
      // this snippet gets the .lastLink's href, which
      // indicates the number of pages, and uses this number 
      // to handle navigating through the pagination and saving 
      // each page's results to disk
      cy.get(".lastLink")
        // get the value of the href attribute on the .lastLink <a> element
        .invoke("attr", "href")
        .then(href => {
          const numberOfPages = parseInt(href.split("&page=")[1]);
          // now that we have the number of pages in pagination,
          // loop through those pages
          // get the current URL of the page that is currently active.
          cy.location("href").then(href => {
            for (let i = 1; i <= numberOfPages; i++) {
              // visit one of n paginated pages
              cy.visit(`${href}&page=${i}`);

              // the div where the links to many pages are
              cy.get(".browse2-result-name a")
                .each($link => {
                  const link = $link.attr("href");
                  hrefs.push({
                    tag_name: tag,
                    link
                  });
                })
                // when all links on the page are captured,
                // write them to disk
                .then(() => {
                  cy.readFile(`data/data.json`).then(() => {
                    cy.writeFile(`data/data.json`, { hrefs });
                  });
                });
              // take a screenshot of each page in the pagination
              cy.screenshot(`screenshots/page-${i}`)
            }
          });
        });
    });
  });
});
