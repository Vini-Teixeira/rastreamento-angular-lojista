describe('Tamanho das Sections', () => {
    beforeEach(() => {
      // Visita a página inicial antes de cada teste
      cy.visit('http://localhost:4200');
    });
  
    it('deve verificar se a Section 3 é maior que a Section 2', () => {
      cy.get('#titulo-second-section').then((section2) => {
        const height2 = section2[0].getBoundingClientRect().height;
  
        cy.get('#titulo-third-section').then((section3) => {
          const height3 = section3[0].getBoundingClientRect().height;
  
          // Verifica se a Section 3 é maior que a Section 2
          expect(height3).to.be.greaterThan(height2, 'A Section 3 deve ser mais alta que a Section 2');
        });
      });
    });
  
    it('deve verificar se o espaçamento entre as sections é consistente', () => {
      // Obtém as posições das sections
      cy.get('#titulo-first-section').then((section1) => {
        const rect1 = section1[0].getBoundingClientRect();
  
        cy.get('#titulo-second-section').then((section2) => {
          const rect2 = section2[0].getBoundingClientRect();
  
          cy.get('#titulo-third-section').then((section3) => {
            const rect3 = section3[0].getBoundingClientRect();
  
            // Calcula as distâncias entre as sections
            const distance1to2 = rect2.top - rect1.bottom;
            const distance2to3 = rect3.top - rect2.bottom;
  
            // Verifica se as distâncias são consistentes (com tolerância de 10px)
            expect(distance1to2).to.be.closeTo(distance2to3, 10, 'O espaçamento entre as sections deve ser consistente');
          });
        });
      });
    });
  
    it('deve verificar se há elementos invisíveis entre as sections', () => {
      // Verifica se há elementos entre a Section 1 e 2
      cy.get('#titulo-first-section').nextUntil('#titulo-second-section').each((element) => {
        cy.wrap(element).should('not.be.visible', 'Elemento entre Section 1 e 2 não deve ser visível');
      });
  
      // Verifica se há elementos entre a Section 2 e 3
      cy.get('#titulo-second-section').nextUntil('#titulo-third-section').each((element) => {
        cy.wrap(element).should('not.be.visible', 'Elemento entre Section 2 e 3 não deve ser visível');
      });
    });
  });