'use strict';

describe('OnsNavigatorElement', () => {
  let nav, nav2;

  beforeEach((done) => {
    let tpl1 = ons._util.createElement(`<ons-template id="hoge"><ons-page>hoge</ons-page></ons-template>`),
      tpl2 = ons._util.createElement(`<ons-template id="fuga"><ons-page>fuga</ons-page></ons-template>`),
      tpl3 = ons._util.createElement(`<ons-template id="info"><ons-page>info</ons-page></ons-template>`);
    document.body.appendChild(tpl1);
    document.body.appendChild(tpl2);
    document.body.appendChild(tpl3);

    nav = ons._util.createElement(`
      <ons-navigator page='hoge'></ons-navigator>
    `);
    nav.options = {cancelIfRunning: false};
    document.body.appendChild(nav);

    setImmediate(() => {
      done();
    });
  });

  afterEach(() => {
    nav.remove();
    nav = null;
  });

  it('should exist', () => {
    expect(window.OnsNavigatorElement).to.be.ok;
  });

  it('provides \'page\' attribute', () => {
      let content = nav.getCurrentPage()._getContentElement();
      expect(content.innerHTML).to.equal('hoge');
  });

  describe('#pages', () => {
    it('provides \'pages\' property', () => {
        let pages = nav.pages;
        expect(pages[0]).to.be.an.instanceof(Element);
        expect(pages[0].name).to.be.an('string');
    });

    it('should have one page after initialization', () => {
       expect(nav.pages.length).to.equal(1);
    });
  });

  describe('#pushPage()', () => {
    it('adds a new page to the top of the page stack', (done) => {
      nav.pushPage('hoge', {
        onTransitionEnd: () => {
          let content = nav.getCurrentPage()._getContentElement();
          expect(nav.pages.length).to.equal(2);
          expect(content.innerHTML).to.equal('hoge');
          done();
        }
      });
    });

    it('adds a new page to the top of the page stack using options.pageHTML', (done) => {
      nav.pushPage({
        pageHTML: '<ons-page>hoge2</ons-page>',
        onTransitionEnd: () => {
          let content = nav.getCurrentPage()._getContentElement();
          expect(nav.pages.length).to.equal(2);
          expect(content.innerHTML).to.equal('hoge2');
          done();
        }
      });
    });

    it('only accepts object options', () => {
      expect(() => nav.pushPage('hoge', 'string')).to.throw(Error);
    });

    it('is canceled if already performing another pushPage', (done, rej) => {
      var spy = chai.spy.on(nav, '_pushPage');

      var counter = 0;

      var myFun = (num, ok) => {
        counter++;

        if (num == 0 && !ok) {
          throw 'First pushPage should go through';
        }

        if (num == 1 && ok) {
          throw 'Second pushPage should not go through';
        }

        if (counter == 2) {
          done();
        }
      };

      var promise1 = nav.pushPage('hoge', {}).then(() => {
        myFun(0, true);
      }, () => {
        myFun(0, false);
      });

      var promise2 = nav.pushPage('hoge', {'cancelIfRunning': true}).then(() => {
        myFun(1, true);
      }, () => {
        myFun(1, false);
      });

      expect(promise1).to.eventually.be.fulfilled;
      expect(promise2).to.eventually.be.rejected;
    });

  });

  describe('#popPage()', () => {
    it('only accepts object options', () => {
      expect(() => nav.popPage('hoge', 'string')).to.throw(Error);
    });

    it('throws error if the stack is empty', (done) => {
      nav.popPage().then( null, () => {
        done();
      });
    });

    it('removes the top page from the stack', (done) => {
      nav.pushPage('fuga', {
        onTransitionEnd: () => {
          let content = nav.getCurrentPage()._getContentElement();
          expect(content.innerHTML).to.equal('fuga');

          nav.popPage({
            onTransitionEnd: () => {
              expect(nav.pages.length).to.equal(1);
              let content = nav.getCurrentPage()._getContentElement();
              expect(content.innerHTML).equal('hoge');
              done();
            }
          });
        }
      });
    });

    it('is canceled if already performing another popPage', (done) => {
      var calls = [false, false];
      var finished = (num) => {
        calls[num] = true;
        if (calls[0] && calls[1]) {
          done();
        }
      };

      nav.pushPage('hoge', {
        onTransitionEnd: () => {
          var spy = chai.spy.on(nav, '_popPage');
          var promise1 = nav.popPage().then((happy) => {
            finished(0);
          });

          var promise2 = nav.popPage({'cancelIfRunning': true}).then(() => {
            console.log('ok 2');
          }, () => {
            finished(1);
          });

        }
      });
    });

    it('can refresh the previous page', (done) => {
      nav.pushPage('info', {
        onTransitionEnd: () => {
          var content = nav.getCurrentPage()._getContentElement();
          content.innerHTML = 'piyo';

          nav.pushPage('fuga', {
            onTransitionEnd: () => {
              nav.popPage({
                refresh: true,
                onTransitionEnd: () => {
                  var content = nav.getCurrentPage()._getContentElement();
                  expect(content.innerHTML).to.equal('info');
                  done();
                }
              });
            }
          });
        }
      });
    });

    it('throws error when refreshing pages directly inside the navigator', (done) => {
      nav.innerHTML = '<ons-page> Test </ons-page>';

      return nav.pushPage('hoge').then(() => {
        try {
          nav.popPage({ refresh: true });
        } catch(err) {
          done();
        }
      });
    });

    it('emits \'prepop\' event', () => {
      let promise = new Promise((resolve) => {
        nav.addEventListener('prepop', (event) => { resolve(event); });
      });

      nav.pushPage('hoge', {
        onTransitionEnd: () => nav.popPage()
      });

      return expect(promise).to.eventually.be.fulfilled;
    });

    it('should be possible to cancel the \'prepop\' event', (done) => {
      nav.addEventListener('prepop', (event) => {
        event.detail.cancel();
      });

      expect(nav.pages.length).to.equal(1);

      nav.pushPage('hoge', {
        onTransitionEnd: () => {
          expect(nav.pages.length).to.equal(2);
          nav.popPage();
          expect(nav.pages.length).to.equal(2);
          done();
        }
      });
    });

    it('emits \'postpop\' event', () => {
      let promise = new Promise((resolve) => {
        nav.addEventListener('postpop', (event) => { resolve(event); });
      });

      nav.pushPage('hoge', {
        onTransitionEnd: () => nav.popPage()
      });

      return expect(promise).to.eventually.be.fulfilled;
    });

    it('emits \'show\' event', (done) => {
      let promise = new Promise((resolve) => {
        nav.addEventListener('show', (event) => { resolve(event); });
      });

      nav.pushPage('hoge', {
        onTransitionEnd: () => nav.popPage({
          onTransitionEnd: () => done()
        })
      });

      return expect(promise).to.eventually.be.fulfilled;
    });

    it('returns a promise that resolves to the new top page', () => {
      return nav.pushPage('hoge').then(() => {
        return expect(nav.popPage()).to.eventually.be.fulfilled.then(
          page => expect(page).to.equal(nav.getCurrentPage())
        );
      });
    });
  });

  describe('#bringPageTop()', () => {

    it('fallback to pushPage if the given page does not exist', (done) => {
      let spy = chai.spy.on(nav, '_pushPage');
      nav.bringPageTop('info');
      expect(spy).to.have.been.called.once;
      done();
    });

    it('does nothing when the page is already on top', (done) => {
      let spy = chai.spy.on(nav, '_pushPage');
      nav.bringPageTop('hoge');
      expect(spy).not.to.have.been.called();
      done();
    });

    it('brings the given pageUrl to the top', (done) => {
      expect(nav.pages.length).to.equal(1);
      expect(nav.getCurrentPage().name).to.equal('hoge');
      nav.bringPageTop('fuga', {
        onTransitionEnd: () => {
          expect(nav.pages.length).to.equal(2);
          expect(nav.getCurrentPage().name).to.equal('fuga');
          nav.bringPageTop('hoge', {
            onTransitionEnd: () => {
              expect(nav.pages.length).to.equal(2);
              expect(nav.getCurrentPage().name).to.equal('hoge');
              expect(nav.pages[nav.pages.length - 2].name).to.equal('fuga');
              done();
            }
          });
        }
      });
    });

    it('brings the given page index to the top', (done) => {
      expect(nav.pages.length).to.equal(1);
      expect(nav.getCurrentPage().name).to.equal('hoge');
      nav.bringPageTop('fuga', {
        onTransitionEnd: () => {
          expect(nav.pages.length).to.equal(2);
          expect(nav.getCurrentPage().name).to.equal('fuga');
          nav.bringPageTop(0, {
            onTransitionEnd: () => {
              expect(nav.pages.length).to.equal(2);
              expect(nav.getCurrentPage().name).to.equal('hoge');
              expect(nav.pages[nav.pages.length - 2].name).to.equal('fuga');
              done();
            }
          });
        }
      });
    });

    it('only accepts string or number as first parameter', () => {
      expect(() => nav.bringPageTop([])).to.throw(Error);
    });

    it('throws error if the given index is not valid', () => {
      expect(() => nav.bringPageTop(20)).to.throw(Error);
    });

    it('only accepts object options', () => {
      expect(() => nav.bringPageTop('hoge', 'string')).to.throw(Error);
    });


    it('should be possible to cancel the \'prepush\' event', (done) => {
      expect(nav.pages.length).to.equal(1);

      nav.bringPageTop('info', {onTransitionEnd: () => {
        expect(nav.pages.length).to.equal(2);

        nav.addEventListener('prepush', (event) => {
          event.detail.cancel();
        });

        nav.bringPageTop('fuga').then(null, () => {
          expect(nav.pages.length).to.equal(2);
          done();
        });
      }});
    });

    it('returns a promise that resolves to the new top page', () => {
      return nav.pushPage('info').then(() => {
        return nav.pushPage('fuga').then(() => {
          return expect(nav.bringPageTop('info')).to.eventually.be.fulfilled.then(
            page => expect(page).to.equal(nav.getCurrentPage())
          );
        });
      });
    });
  });

  describe('#insertPage()', () => {
    it('inserts a new page on a given index', (done) => {
      nav.pushPage('info', {
        onTransitionEnd: () => {
          nav.insertPage(0, 'fuga');
          setImmediate(() => {
            expect(nav.pages.length).to.equal(3);

            let content = nav.pages[0]._getContentElement();
            expect(content.innerHTML).to.equal('fuga');

            done();
          });
        }
      });
    });

    it('inserts a new page on a given index using `options.pageHTML`', (done) => {
      nav.pushPage('info', {
        onTransitionEnd: () => {
          nav.insertPage(0, {pageHTML: '<ons-page>fuga</ons-page>'});
          setImmediate(() => {
            expect(nav.pages.length).to.equal(3);

            let content = nav.pages[0]._getContentElement();
            expect(content.innerHTML).to.equal('fuga');

            done();
          });
        }
      });
    });

    it('only accepts object options', () => {
      expect(() => nav.insertPage(0, 'hoge', 'string')).to.throw(Error);
    });

    it('redirects to pushPage if the insertion is at the top', () => {
      var spy = chai.spy.on(nav, 'pushPage');
      nav.insertPage(1, 'info', {});
      expect(spy).to.have.been.called.once;
    });

    it('normalizes the index', (done) => {
      nav.pushPage('info', {
        onTransitionEnd: () => {
          nav.insertPage(-2, 'fuga').then( () => {
            expect(nav.pages.length).to.equal(3);

            let content = nav.pages[0]._getContentElement();
            expect(content.innerHTML).to.equal('fuga');

            done();
          });
        }
      });
    });

    it('returns a promise that resolves to the inserted page', () => {
      return nav.pushPage('hoge').then(() => {
        return expect(nav.insertPage(0, 'fuga')).to.eventually.be.fulfilled.then(
          page => expect(page).to.equal(nav.pages[0])
        );
      });
    });
  });

  describe('#replacePage()', () => {
    it('only accepts object options', () => {
      expect(() => nav.replacePage('hoge', 'string')).to.throw(Error);
    });

    it('replaces the current page with a new one', (done) => {
      nav.pushPage('info', {
        onTransitionEnd: () => {
          expect(nav.pages.length).to.equal(2);
          let content = nav.getCurrentPage()._getContentElement();
          expect(content.innerHTML).to.equal('info');

          nav.replacePage('fuga', {
            onTransitionEnd: () => {
              expect(nav.pages.length).to.equal(2);
              let content = nav.getCurrentPage()._getContentElement();
              expect(content.innerHTML).to.equal('fuga');
              done();
            }
          });
        }
      });
    });

    it('returns a promise that resolves to the new top page', (done) => {
      return nav.pushPage('hoge').then(() => {
        return expect(nav.replacePage('fuga')).to.eventually.be.fulfilled.then(
          page => {
            expect(page).to.equal(nav.getCurrentPage());
            done();
          }
        );
      });
    });
  });

  describe('#resetToPage()', () => {
    it('only accepts object options', () => {
      expect(() => nav.resetToPage('hoge', 'string')).to.throw(Error);
    });

    it('replaces all the page stack with only a new page', (done) => {
      nav.pushPage('fuga', {onTransitionEnd: () => {
        nav.resetToPage('hoge', {
          onTransitionEnd: () => {
            expect(nav.pages.length).to.equal(1);
            let content = nav.getCurrentPage()._getContentElement();
            expect(content.innerHTML).to.equal('hoge');
            done();
          }
        });
      }});
    });

    it('returns a promise that resolves to the new top page', () => {
      return nav.pushPage('hoge').then(() => {
        return expect(nav.resetToPage('fuga')).to.eventually.be.fulfilled.then(
          page => expect(page).to.equal(nav.getCurrentPage())
        );
      });
    });
  });

  describe('#getCurrentPage()', () => {
    it('returns the current page', () => {
      let page = nav.getCurrentPage();

      expect(page).to.be.an.instanceof(Element);
      expect(page.name).to.be.an('string');
    });

    it('throws error if page stack is empty', () => {
      nav._destroy();
      expect(() => nav.getCurrentPage()).to.throw(Error);
    });
  });

  describe('#_destroy()', () => {
    it('destroys all the pages', () => {
      expect(nav.pages.length).to.equal(1);
      nav._destroy();
      expect(nav.pages.length).to.equal(0);
    });
  });

  describe('#_createPageElement()', () => {
    it('throws an error when no ons-page is provided', () => {
      let tmp = ons._internal.normalizePageHTML;
      ons._internal.normalizePageHTML = (html) => '<div>' + html + '</div>';
      expect(() => nav._createPageElement('Test')).to.throw(Error);
      ons._internal.normalizePageHTML = tmp;
    });
  });

  describe('#_onDeviceBackButton()', () => {
    it('pops a page if there are more than one', (done) => {
      nav.pushPage('hoge', {
        onTransitionEnd: () => {
          var spy = chai.spy.on(nav, 'popPage');
          nav._onDeviceBackButton();
          expect(spy).to.have.been.called.once;
          done();
        }
      });
    });

    it('calls event parent handler if there are less than two pages', () => {
      var event = { 'callParentHandler': () => { return; }};
      var spy = chai.spy.on(event, 'callParentHandler');
      nav._onDeviceBackButton(event);
      expect(spy).to.have.been.called.once;
    });
  });

  describe('propagate API', () => {

    it('fires \'show\' event', () => {
      let promise = new Promise((resolve) => {
        nav.addEventListener('show', (event) => resolve());
      });

      nav.pushPage('hoge', {
        onTransitionEnd: () => {
          nav._hide();
          nav._show();
        }
      });

      return expect(promise).to.eventually.be.fulfilled;
    });

    it('fires \'hide\' event', () => {
      let promise = new Promise((resolve) => {
        nav.addEventListener('hide', () => resolve());
      });

      nav.pushPage('hoge', {
        onTransitionEnd: () => nav._hide()
      });

      return expect(promise).to.eventually.be.fulfilled;
    });

    it('fires \'destroy\' event', () => {
      let promise = new Promise((resolve) => {
        nav.addEventListener('destroy', () => resolve());
      });

      nav.pushPage('hoge', {
        onTransitionEnd: () => nav._destroy()
      });

      return expect(promise).to.eventually.be.fulfilled;
    });
  });

  describe('#registerAnimator()', () => {
    it('throws an error if animator is not a NavigatorAnimator', () => {
      expect(() => window.OnsNavigatorElement.registerAnimator('hoge', 'hoge')).to.throw(Error);
    });

    it('registers a new animator', () => {
      class MyAnimator extends window.OnsNavigatorElement.NavigatorTransitionAnimator {
      }

      window.OnsNavigatorElement.registerAnimator('hoge', MyAnimator);
    });
  });

  describe('#_compile()', () => {
    it('does not compile twice', () => {
      let div1 = document.createElement('div');
      let div2 = document.createElement('div');
      div1.innerHTML = '<ons-navigator></ons-navigator>';
      div2.innerHTML = div1.innerHTML;
      expect(div1.isEqualNode(div2)).to.be.true;
    });
  });

  describe('#backButton', () => {
    beforeEach((done) => {
      let tpl1 = ons._util.createElement(`<ons-template id="backPage"><ons-back-button>Back</ons-back-button><ons-page>hoge</ons-page></ons-template>`),
        tpl2 = ons._util.createElement(`<ons-template id="backPage2"><ons-back-button>Back</ons-back-button><ons-page>hoge2</ons-page></ons-template>`);

      document.body.appendChild(tpl1);
      document.body.appendChild(tpl2);
      nav2 = ons._util.createElement(` <ons-navigator page='backPage'></ons-navigator> `);
      nav2.options = {cancelIfRunning: false};
      document.body.appendChild(nav2);

      setImmediate(() => {
        done();
      });
    });

    it('should not display on first page', () => {
        let backBtn = nav2.getCurrentPage().backButton;
        expect(backBtn.style.display).to.equal('none');
    });

    it('should display button after push', (done) => {
        nav2.pushPage('backPage').then(() => {
          const backBtn = nav2.getCurrentPage().backButton;
          expect(backBtn.style.display).to.equal('inline-block');
          done();
        });
    });

    it('should display button after insert and hide after pop', (done) => {
        nav2.insertPage(0, 'backPage').then(() => {
          var backBtn = nav2.getCurrentPage().backButton;
          expect(backBtn.style.display).to.equal('inline-block');

          nav2.popPage().then(() => {
            backBtn = nav2.getCurrentPage().backButton;
            expect(backBtn.style.display).to.equal('none');
            done();
          });
        });
    });


    it('should display button after insert and hide after reset', (done) => {
        nav2.pushPage('backPage2').then(() => {
          var backBtn = nav2.getCurrentPage().backButton;
          expect(backBtn.style.display).to.equal('inline-block');

          nav2.resetToPage('backPage').then(() => {
            backBtn = nav2.getCurrentPage().backButton;
            expect(backBtn.style.display).to.equal('none');
            done();
          });
        });
    });

    afterEach(() => {
      nav2.remove();
      nav2 = null;
    });

  });
});
