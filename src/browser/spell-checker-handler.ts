import { app, MenuItem } from 'electron';

import { ContextMenuBuilder, SpellCheckHandler } from 'electron-spellchecker';
import { isMac } from '../common/env';
import { i18n, LocaleType } from '../common/i18n';

export class SpellChecker {
    public locale: LocaleType = 'en-US';
    private readonly spellCheckHandler: SpellCheckHandler;

    constructor() {
        this.spellCheckHandler = new SpellCheckHandler();
        this.spellCheckHandler.automaticallyIdentifyLanguages = false;
        // language is switched w.r.t to the current system language.
        if (!isMac) {
            const sysLocale = app.getLocale() || 'en-US';
            this.spellCheckHandler.switchLanguage(sysLocale);
        }

        app.on('web-contents-created', (_event, webContents): void => {
            this.attachToWebContents(webContents);
        });
    }

    /**
     * Attaches context-menu event for every webContents
     *
     * @param webContents {Electron.WebContents}
     */
    public attachToWebContents(webContents: Electron.WebContents): void {
        const contextMenuBuilder = new ContextMenuBuilder(this.spellCheckHandler, webContents, false, this.processMenu);
        const contextMenuListener = (_event, info) => {
            if (this.locale !== i18n.getLocale()) {
                contextMenuBuilder.setAlternateStringFormatter(this.getStringTable());
                this.spellCheckHandler.updateContextMenuLocale(i18n.t('ContextMenu')());
                this.locale = i18n.getLocale();
            }
            contextMenuBuilder.showPopupMenu(info);
        };

        webContents.on('context-menu', contextMenuListener);
        webContents.once('destroyed', () => {
            webContents.removeListener('context-menu', contextMenuListener);
        });
    }

    /**
     * Builds the string table for context menu
     *
     * @return {Object} - String table for context menu
     */
    private getStringTable(): object {
        const namespace = 'ContextMenu';
        return {
            copyMail: () => i18n.t('Copy Email Address', namespace)(),
            copyLinkUrl: () => i18n.t('Copy Link', namespace)(),
            openLinkUrl: () => i18n.t('Open Link', namespace)(),
            copyImageUrl: () => i18n.t('Copy Image URL', namespace)(),
            copyImage: () => i18n.t('Copy Image', namespace)(),
            addToDictionary: () => i18n.t('Add to Dictionary', namespace)(),
            lookUpDefinition: (lookup) => {
                const formattedString = i18n.t('Look Up {searchText}', namespace)( { searchText: lookup.word });
                return formattedString || `Look Up ${lookup.word}`;
            },
            searchGoogle: () => i18n.t('Search with Google', namespace)(),
            cut: () => i18n.t('Cut')(),
            copy: () => i18n.t('Copy')(),
            paste: () => i18n.t('Paste')(),
            inspectElement: () => i18n.t('Inspect Element', namespace)(),
        };
    }

    /**
     * Method to add default menu items to the
     * menu that was generated by ContextMenuBuilder
     *
     * This method get invoked by electron-spellchecker
     * before showing the context menu
     *
     * @param menu
     * @returns menu
     */
    private processMenu(menu: Electron.Menu): Electron.Menu {
        let isLink = false;
        menu.items.map((item) => {
            if (item.label === 'Copy Link') {
                isLink = true;
            }
            return item;
        });

        if (!isLink) {
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({
                role: 'reload',
                accelerator: 'CmdOrCtrl+R',
                label: i18n.t('Reload')(),
            }));
        }
        return menu;
    }
}