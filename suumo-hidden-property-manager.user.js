// ==UserScript==
// @name         SUUMO物件非表示マネージャ 🏠
// @name:ja      SUUMO物件非表示マネージャ 🏠
// @name:en      SUUMO Hidden Property Manager 🏠
// @version      3.1.0
// @description         SUUMOの検索結果（建物ごとに表示）で「非表示」ボタンから不要な物件を隠せる！モーダルUIから復活も簡単。保存はローカル。
// @description:ja      SUUMOの検索結果（建物ごとに表示）で「非表示」ボタンから不要な物件を隠せる！モーダルUIから復活も簡単。保存はローカル。
// @description:en      Hide unwanted listings in SUUMO's grouped-by-building search results! Restore via modal UI. Data saved locally.
// @namespace    https://github.com/koyasi777/suumo-hidden-property-manager
// @author       koyasi777
// @match        https://suumo.jp/jj/chintai/ichiran/FR*
// @grant        GM_addStyle
// @run-at       document-idle
// @license      MIT
// @homepageURL  https://github.com/koyasi777/suumo-hidden-property-manager
// @supportURL   https://github.com/koyasi777/suumo-hidden-property-manager/issues
// @icon         https://www.suumo.jp/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'suumoHiddenProperties';
    const PROPERTY_LI_PREFIX = 'property-li-';
    console.log('SUUMO非表示スクリプト v3.1: 実行開始');

    // --- データ管理ロジック (変更なし) ---
    const storage = {
        get: () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
        save: (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)),
        add: (property) => {
            const properties = storage.get();
            if (!properties.some(p => p.id === property.id)) {
                properties.push(property);
                storage.save(properties);
            }
        },
        remove: (propertyId) => {
            let properties = storage.get();
            properties = properties.filter(p => p.id !== propertyId);
            storage.save(properties);
        },
        clear: () => localStorage.removeItem(STORAGE_KEY)
    };

    // --- UI/DOM操作 ---
    const ui = {
        /* ===== CSS定義を修正 ===== */
        injectCSS: () => {
            GM_addStyle(`
                /* ボタンの共通スタイルを洗練化 */
                .suumo-control-button {
                    padding: 8px 14px;
                    color: white !important;
                    border: none;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: bold;
                    font-family: "メイリオ", Meiryo, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", "ＭＳ Ｐゴシック", sans-serif;
                    line-height: 1.2;
                    text-decoration: none !important;
                    display: inline-block;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                    transition: all 0.15s ease-in-out;
                }
                /* マウスオーバー時のインタラクション */
                .suumo-control-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    filter: brightness(1.1);
                }
                /* クリック時のインタラクション */
                .suumo-control-button:active {
                    transform: translateY(1px);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    filter: brightness(0.95);
                }

                /* モーダルウィンドウのスタイル */
                .hide-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9998; display: none; }
                .hide-modal-content { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; z-index: 9999; padding: 20px 30px; border-radius: 8px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; display: none; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
                .hide-modal-content h2 { margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 10px; font-family: "メイリオ", Meiryo, sans-serif;}
                .hide-modal-close { position: absolute; top: 15px; right: 20px; font-size: 24px; font-weight: bold; cursor: pointer; color: #aaa; }
                .hidden-property-list { list-style: none; padding: 0; }
                .hidden-property-list li { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
                .hidden-property-info a { text-decoration: none; color: #0073e6; font-weight: bold; font-family: "メイリオ", Meiryo, sans-serif;}
                .hidden-property-info span { display: block; font-size: 0.9em; color: #555; font-family: "メイリオ", Meiryo, sans-serif;}

                /* ボタン設置用のFlexboxスタイル */
                .inquiry.inquiry--top { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; /* 余白調整 */ }
            `);
        },
        createControls: () => {
            if (document.getElementById('suumo-hide-controls')) return;
            const targetParent = document.querySelector('.inquiry.inquiry--top');
            if (!targetParent) return;

            const controlsContainer = document.createElement('div');
            controlsContainer.id = 'suumo-hide-controls';
            controlsContainer.style.display = 'flex';
            controlsContainer.style.gap = '8px';

            const manageButton = document.createElement('button');
            manageButton.textContent = '非表示リスト管理';
            manageButton.className = 'suumo-control-button';
            manageButton.style.backgroundColor = '#5bc0de';
            manageButton.onclick = () => ui.toggleModal(true);

            const resetButton = document.createElement('button');
            resetButton.textContent = '全リセット';
            resetButton.className = 'suumo-control-button';
            resetButton.style.backgroundColor = '#f0ad4e';
            resetButton.onclick = () => {
                if (confirm('非表示にした全ての物件をリセットしますか？')) {
                    storage.get().forEach(p => ui.restoreProperty(p.id));
                    storage.clear();
                    alert('リセットしました。');
                }
            };

            controlsContainer.appendChild(manageButton);
            controlsContainer.appendChild(resetButton);
            targetParent.appendChild(controlsContainer);
        },
        createModal: () => {
            if (document.getElementById('hide-modal')) return;
            document.body.insertAdjacentHTML('beforeend', `
                <div id="hide-modal-overlay" class="hide-modal-overlay"></div>
                <div id="hide-modal-content" class="hide-modal-content">
                    <span class="hide-modal-close">&times;</span>
                    <h2>非表示物件リスト</h2>
                    <ul id="hidden-property-list" class="hidden-property-list"></ul>
                </div>
            `);
            document.getElementById('hide-modal-overlay').onclick = () => ui.toggleModal(false);
            document.querySelector('#hide-modal-content .hide-modal-close').onclick = () => ui.toggleModal(false);
        },
        populateModal: () => {
            const listElement = document.getElementById('hidden-property-list');
            const hiddenProperties = storage.get();
            listElement.innerHTML = '';

            if (hiddenProperties.length === 0) {
                listElement.innerHTML = '<li>非表示中の物件はありません。</li>';
                return;
            }

            hiddenProperties.forEach(prop => {
                const listItem = document.createElement('li');
                listItem.id = `hidden-item-${prop.id}`;
                listItem.innerHTML = `
                    <div class="hidden-property-info">
                        <a href="${prop.url}" target="_blank" rel="noopener noreferrer">${prop.name}</a>
                        <span>${prop.rent}</span>
                    </div>
                `;
                const restoreButton = document.createElement('button');
                restoreButton.textContent = '復活';
                restoreButton.className = 'suumo-control-button';
                restoreButton.style.backgroundColor = '#5cb85c';
                restoreButton.onclick = () => {
                    storage.remove(prop.id);
                    ui.restoreProperty(prop.id);
                    listItem.remove();
                    if (document.querySelectorAll('#hidden-property-list li').length === 0) {
                       listElement.innerHTML = '<li>非表示中の物件はありません。</li>';
                    }
                };
                listItem.appendChild(restoreButton);
                listElement.appendChild(listItem);
            });
        },
        toggleModal: (show) => {
            const overlay = document.getElementById('hide-modal-overlay');
            const content = document.getElementById('hide-modal-content');
            if (show) {
                ui.populateModal();
                overlay.style.display = 'block';
                content.style.display = 'block';
            } else {
                overlay.style.display = 'none';
                content.style.display = 'none';
            }
        },
        restoreProperty: (propertyId) => {
            const propertyLi = document.getElementById(PROPERTY_LI_PREFIX + propertyId);
            if (propertyLi) {
                propertyLi.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                propertyLi.style.display = 'block';
                setTimeout(() => {
                    propertyLi.style.opacity = '1';
                    propertyLi.style.transform = 'scale(1)';
                }, 10);
            }
        }
    };

    // --- メイン処理ロジック ---
    function processPropertyItems() {
        const hiddenIds = storage.get().map(p => p.id);
        const propertyItems = document.querySelectorAll('.cassetteitem:not(.hide-processed)');

        propertyItems.forEach(item => {
            item.classList.add('hide-processed');
            const checkbox = item.querySelector('input.js-single_checkbox[type="checkbox"]');
            const bukkenId = checkbox ? checkbox.value : null;
            if (!bukkenId) return;

            const parentLi = item.closest('li');
            if (!parentLi) return;

            parentLi.id = PROPERTY_LI_PREFIX + bukkenId;

            if (hiddenIds.includes(bukkenId)) {
                parentLi.style.display = 'none';
                parentLi.style.opacity = '0';
                return;
            } else {
                parentLi.style.opacity = '1';
                parentLi.style.transform = 'scale(1)';
            }

            const buttonContainer = item.querySelector('.cassetteitem_other-col09');
            if (buttonContainer) {
                const hideButton = document.createElement('button');
                hideButton.textContent = '非表示';
                hideButton.className = 'suumo-control-button';
                hideButton.style.backgroundColor = '#d9534f';
                hideButton.style.marginTop = '5px';
                hideButton.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const name = item.querySelector('.cassetteitem_content-title')?.textContent.trim() || '物件名不明';
                    const rent = item.querySelector('.cassetteitem_price--rent')?.textContent.trim() || '賃料不明';
                    const url = item.querySelector('.js-cassette_link_href')?.href || '#';

                    if (confirm(`【${name}】を非表示にしますか？`)) {
                        storage.add({ id: bukkenId, name, rent, url });
                        parentLi.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        parentLi.style.opacity = '0';
                        parentLi.style.transform = 'scale(0.95)';
                        setTimeout(() => { parentLi.style.display = 'none'; }, 400);
                    }
                };
                buttonContainer.appendChild(hideButton);
            }
        });
    }

    // --- 初期化と監視 ---
    function init() {
        ui.injectCSS();
        ui.createModal();

        const observer = new MutationObserver(() => {
            ui.createControls();
            processPropertyItems();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // 初期実行
        ui.createControls();
        processPropertyItems();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
