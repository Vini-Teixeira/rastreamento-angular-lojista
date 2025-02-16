describe('Landing Page', () => {
    beforeEach(() => {
      // Visita a página inicial antes de cada teste
      cy.visit('http://localhost:4200');
    });
  
    it('deve verificar se as distâncias entre as seções são iguais', () => {
      // Obtém as posições das seções usando os IDs
      cy.get('#titulo-first-section').then((firstSection) => {
        cy.get('#titulo-second-section').then((secondSection) => {
          cy.get('#titulo-third-section').then((thirdSection) => {
            // Obtém as coordenadas das seções
            const rect1 = firstSection[0].getBoundingClientRect();
            const rect2 = secondSection[0].getBoundingClientRect();
            const rect3 = thirdSection[0].getBoundingClientRect();
  
            // Calcula as distâncias entre as seções
            const distance1to2 = rect2.top - rect1.bottom;
            const distance2to3 = rect3.top - rect2.bottom;
  
            // Verifica se as distâncias são iguais
            expect(distance1to2).to.equal(distance2to3);
          });
        });
      });
    });
  
    it('deve verificar se o Header e o Footer estão visíveis', () => {
      // Verifica se o Header está visível
      cy.get('header').should('be.visible');
  
      // Verifica se o Footer está visível
      cy.get('footer').should('be.visible');
    });
  
    it('deve verificar se os links do Header redirecionam para as seções corretas', () => {
      // Clica no link "O que é?" e verifica se a página rola até a primeira seção
      cy.get('a[href="#titulo-first-section"]').click();
      cy.get('#titulo-first-section').should('be.visible');
  
      // Clica no link "Como funciona?" e verifica se a página rola até a segunda seção
      cy.get('a[href="#titulo-second-section"]').click();
      cy.get('#titulo-second-section').should('be.visible');
  
      // Clica no link "Ferramentas" e verifica se a página rola até a terceira seção
      cy.get('a[href="#titulo-third-section"]').click();
      cy.get('#titulo-third-section').should('be.visible');
    });
  
    it('deve verificar se o conteúdo das seções está correto', () => {
      // Verifica o conteúdo da primeira seção
      cy.get('#titulo-first-section h1').should('contain', 'O que é?');
      cy.get('#titulo-first-section .first-span').should('contain', 'Uma aplicação para');
  
      // Verifica o conteúdo da segunda seção
      cy.get('#titulo-second-section h1').should('contain', 'Como funciona?');
      cy.get('#titulo-second-section .second-span').should('contain', 'São usadas várias tecnologias');
  
      // Verifica o conteúdo da terceira seção
      cy.get('#titulo-third-section h1').should('contain', 'Ferramentas');
      cy.get('#titulo-third-section .third-span').should('contain', 'Ferramentas como');
    });
  });