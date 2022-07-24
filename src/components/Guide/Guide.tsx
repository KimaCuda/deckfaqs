import {
    DialogButton,
    Focusable,
    QuickAccessTab,
    Router,
} from 'decky-frontend-lib';
import React, { useContext, useMemo, useRef } from 'react';
import { useEffect } from 'react';
import {
    AppContext,
    AppContextProvider,
    GuideContents,
} from '../../context/AppContext';
import parse, {
    HTMLReactParserOptions,
    Element,
    domToReact,
} from 'html-react-parser';
import { ActionType } from '../../reducers/AppReducer';
import { DefaultProps, getGuideHtml } from '../../utils';
import { TocDropdown } from '../Nav/TocDropdown';

type GuideProps = DefaultProps & {
    fullscreen?: boolean;
};

export const Guide = ({ serverApi, fullscreen }: GuideProps) => {
    const { state, dispatch } = useContext(AppContext);
    const { currentGuide } = state;
    const guideDiv = useRef<HTMLDivElement>(null);
    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const options: HTMLReactParserOptions = {
        replace: (domNode) => {
            if (
                domNode instanceof Element &&
                domNode.name === 'a' &&
                domNode.attribs &&
                domNode.attribs.href
            ) {
                const children = domNode.children;
                let anchor = '';
                if (domNode.attribs.href.startsWith('#')) {
                    anchor = domNode.attribs.href.substring(1);
                    return (
                        <a
                            {...domNode.attribs}
                            onClick={(e) => {
                                e.preventDefault();
                                dispatch({
                                    type: ActionType.UPDATE_GUIDE,
                                    payload: { ...currentGuide, anchor },
                                });
                            }}
                        >
                            {domToReact(children)}
                        </a>
                    );
                } else {
                    anchor = domNode.attribs.href;
                    return (
                        <a
                            {...domNode.attribs}
                            onClick={(e) => {
                                e.preventDefault();
                                const baseUrl = currentGuide?.guideUrl ?? '';
                                getGuideHtml(
                                    `${baseUrl}/${anchor}`,
                                    serverApi,
                                    (result: string) => {
                                        if (anchor.indexOf('#') > 0) {
                                            anchor = anchor.substring(
                                                anchor.indexOf('#') + 1
                                            );
                                        } else {
                                            anchor = '';
                                        }
                                        dispatch({
                                            type: ActionType.UPDATE_GUIDE,
                                            payload: {
                                                ...currentGuide,
                                                guideHtml: result,
                                                anchor,
                                            },
                                        });
                                    }
                                );
                            }}
                        >
                            {domToReact(children)}
                        </a>
                    );
                }
            } else if (
                domNode instanceof Element &&
                domNode.name === 'div' &&
                domNode.attribs &&
                domNode.attribs.class === 'ftoc'
            ) {
                return <span></span>;
            } else if (
                domNode instanceof Element &&
                domNode.name === 'img' &&
                domNode.attribs &&
                domNode.attribs.src
            ) {
                return (
                    <img
                        {...domNode.attribs}
                        src={`https://gamefaqs.gamespot.com${domNode.attribs.src}`}
                    />
                );
            }
            return domNode;
        },
    };

    useEffect(() => {
        const anchor = state.currentGuide?.anchor;
        scrollToAnchor(anchor);
    }, [state.currentGuide?.anchor, state.currentGuide?.guideHtml]);

    const handleDismiss = (updatedGuide: GuideContents) => {
        dispatch({
            type: ActionType.UPDATE_GUIDE,
            payload: updatedGuide,
        });
    };
    const scrollToAnchor = (anchor: string = '') => {
        if (anchor.length > 0) {
            const elementToScrollTo =
                guideDiv.current?.querySelector(`[name="${anchor}"]`) ??
                guideDiv.current?.querySelector(`[id="${anchor}"]`);
            if (elementToScrollTo) {
                elementToScrollTo.scrollIntoView();
            } else {
                const baseUrl = currentGuide?.guideUrl ?? '';
                getGuideHtml(
                    `${baseUrl}/#${anchor}`,
                    serverApi,
                    (result: string) => {
                        dispatch({
                            type: ActionType.UPDATE_GUIDE,
                            payload: {
                                ...currentGuide,
                                guideHtml: result,
                                anchor,
                            },
                        });
                    }
                );
            }
        } else {
            guideDiv.current?.querySelector('#faqwrap')?.scrollIntoView();
        }
    };

    let cssId: any = '';
    useEffect(() => {
        serverApi
            .injectCssIntoTab(
                !fullscreen ? 'QuickAccess' : 'SP',
                `
              .deckfaqs_dark {
                filter: invert(1)
              }
              .deckfaqs_dark img:not(.ignore-color-scheme),video:not(.ignore-color-scheme) {
                filter: brightness(50%) invert(100%);
              }
              .ffaq {
                font-size: 14px;
                word-wrap: break-word;
                color: #000;
              }
              .ffaq p {
                line-height: 20px;
              }
              .ffaq div.section_box,
              .ffaq div.spoiler_box,
              .ffaq blockquote {
                background-color: #999;
                border-style: solid;
                border-width: 1px;
                clear: left;
                color: #0d0d0d;
                display: table;
                margin: 15px 15px 18px 0;
                overflow: hidden;
                padding: 5px;
                width: 66%;
              }
              @media (max-width: 767px) {
                .ffaq div.section_box,
                .ffaq div.spoiler_box,
                .ffaq blockquote {
                  overflow: auto;
                }
              }
              @media (max-width: 767px) {
                .ffaq div.section_box,
                .ffaq div.spoiler_box,
                .ffaq blockquote {
                  display: block;
                  overflow-x: scroll;
                  width: auto;
                }
              }
              .ffaq div.section_box p:last-child,
              .ffaq div.section_box ul:last-child,
              .ffaq div.section_box ol:last-child,
              .ffaq div.section_box dl:last-child,
              .ffaq div.spoiler_box p:last-child,
              .ffaq div.spoiler_box ul:last-child,
              .ffaq div.spoiler_box ol:last-child,
              .ffaq div.spoiler_box dl:last-child,
              .ffaq blockquote p:last-child,
              .ffaq blockquote ul:last-child,
              .ffaq blockquote ol:last-child,
              .ffaq blockquote dl:last-child {
                margin-bottom: 0;
              }
              .ffaq div.spoiler_box,
              .ffaq i[data-spoiler="inline"],
              .ffaq .fspoiler,
              .ffaq .fspoiler a {
                background-color: #bbb;
                border-color: #d9d9d9;
                color: #bbb;
              }
              .ffaq i[data-spoiler="inline"] {
                font-style: normal;
              }
              .ffaq i[data-spoiler="inline"] h6 {
                color: #b31a1a;
              }
              .ffaq i[data-underline="inline"] {
                font-style: normal;
                text-decoration: underline;
              }
              .ffaq hr,
              .ffaq pre {
                margin-bottom: 18px;
              }
              .ffaq table {
                border: 1px solid #000;
                margin-bottom: 18px;
                margin-right: 5px;
                table-layout: fixed;
                width: auto;
              }
              @media (max-width: 979px) {
                .ffaq table {
                  clear: both;
                }
              }
              @media (max-width: 767px) {
                .ffaq table {
                  width: 100% !important;
                }
              }
              @media (max-width: 767px) {
                .ffaq table {
                  display: inline-table;
                  overflow-x: scroll;
                }
              }
              .ffaq table tr:nth-child(2n + 1),
              .ffaq table tr:nth-child(2n + 1) td {
                background-color: #d3d3d3;
              }
              .ffaq table td,
              .ffaq table th {
                background-color: #d3d3d3;
                border: 1px solid #000;
                color: #0d0d0d;
                box-shadow: none;
                font: inherit;
                padding: 3px 5px;
                text-shadow: none;
                vertical-align: middle;
              }
              @media (max-width: 767px) {
                .ffaq table td,
                .ffaq table th {
                  font-size: 10px;
                  padding: 1px;
                }
              }
              .ffaq table td.l,
              .ffaq table th.l {
                text-align: left;
              }
              .ffaq table td.c,
              .ffaq table th.c {
                text-align: center;
              }
              .ffaq table td.r,
              .ffaq table th.r {
                text-align: right;
              }
              .ffaq table td img,
              .ffaq table th img {
                max-width: none !important;
              }
              .ffaq table td p:last-child,
              .ffaq table th p:last-child {
                margin-bottom: 0;
              }
              .ffaq table tr {
                border: 1px solid #000;
              }
              .ffaq table th,
              .ffaq table thead td {
                background-color: #999999 !important;
                font-weight: bold;
                text-align: center;
              }
              .ffaq table.unmargin {
                display: inline-table;
              }
              .ffaq div.fimg_small,
              .ffaq div.fimg_smallleft,
              .ffaq div.fimg_smallright,
              .ffaq div.fimg_large,
              .ffaq div.fimg_largeleft,
              .ffaq div.cimg_s,
              .ffaq div.cimg_l {
                font-size: 10px;
                border-style: solid;
                border-width: 1px;
                padding: 2px;
              }
              .ffaq div.fimg_small,
              .ffaq div.cimg_s {
                clear: right;
                float: right;
                margin: 10px 10px 18px;
                max-width: 300px;
              }
              @media (max-width: 767px) {
                .ffaq div.fimg_small,
                .ffaq div.cimg_s {
                  clear: both;
                  display: inline-block;
                  float: none;
                  margin: 0 0 10px;
                }
              }
              .ffaq div.fimg_smallleft,
              .ffaq div.cimg_sleft {
                clear: left;
                float: left;
                margin: 10px 20px 10px 10px;
                max-width: 300px;
              }
              @media (max-width: 767px) {
                .ffaq div.fimg_smallleft,
                .ffaq div.cimg_sleft {
                  clear: both;
                  display: inline-block;
                  float: none;
                  margin: 0 0 10px;
                }
              }
              .ffaq div.fimg_smallright,
              .ffaq div.cimg_sright {
                clear: right;
                float: right;
                margin: 10px 10px 10px 20px;
                max-width: 300px;
              }
              @media (max-width: 767px) {
                .ffaq div.fimg_smallright,
                .ffaq div.cimg_sright {
                  clear: both;
                  display: inline-block;
                  float: none;
                  margin: 0 0 10px;
                }
              }
              .ffaq div.fimg_largeleft {
                clear: left;
                float: left;
                margin: 10px 10px 18px;
                max-width: 750px;
              }
              @media (max-width: 767px) {
                .ffaq div.fimg_largeleft {
                  margin: 0;
                  max-width: 100%;
                }
              }
              .ffaq div.fimg_large,
              .ffaq div.cimg_l {
                clear: both;
                float: left;
                margin: 10px 10px 18px;
                max-width: 750px;
              }
              @media (max-width: 767px) {
                .ffaq div.fimg_large,
                .ffaq div.cimg_l {
                  margin: 0;
                }
              }
              .ffaq div.clear {
                clear: left;
              }
              .ffaq img.fimg_small,
              .ffaq img.fimg_large,
              .ffaq img.cimg_s,
              .ffaq img.cimg_l {
                height: auto;
                max-width: 100% !important;
                width: auto;
              }
              .ffaq img.imgleft {
                float: left;
                margin-right: 10px;
              }
              .ffaq img.imgright {
                float: right;
                margin-left: 10px;
              }
              .ffaq img.imgnofloat {
                float: none;
                margin-right: 2px;
                vertical-align: middle;
              }
              @media (max-width: 767px) {
                .ffaq img.bigresize {
                  height: 100% !important;
                  width: 100% !important;
                }
                .ffaq table img.bigresize {
                  height: auto !important;
                  width: auto !important;
                  max-height: 100% !important;
                  max-width: 100% !important;
                }
              }
              .ffaq ol,
              .ffaq ul {
                margin-bottom: 18px;
                padding-left: 40px;
              }
              .ffaq ol li,
              .ffaq ul li {
                line-height: 18px;
                margin-bottom: 0;
                padding: 3px 0;
              }
              .ffaq ol li ol,
              .ffaq ol li ul,
              .ffaq ul li ol,
              .ffaq ul li ul {
                margin-bottom: 0;
              }
              .ffaq:not(.faq_menu_wrap) ul + li,
              .ffaq:not(.faq_menu_wrap) ol + li {
                margin-top: -20px;
              }
              .ffaq dl dl {
                text-indent: 15px;
              }
              .ffaq dl dl dl {
                text-indent: 40px;
              }
              .ffaq dl dl dl dl {
                text-indent: 65px;
              }
              .ffaq .faqtext {
                margin: 0 auto !important;
                background: #fff;
              }
              @media (max-width: 767px) {
                .ffaq .faqtext {
                  overflow-x: auto;
                }
              }
              @media (min-width: 768px) {
                .ffaq .faqtext {
                  padding: 25px 100px;
                }
              }
              @media (max-width: 767px) {
                .ffaq .faqtext {
                  background: none !important;
                }
              }
              .ffaq .faqtext pre {
                margin: 0px !important;
                white-space: pre-wrap;
                font: 14px "Courier New", "Courier", monospace !important;
              }
              @media (max-width: 767px) {
                .ffaq .faqtext pre {
                  font: 11px "Courier New", "Courier", monospace !important;
                }
              }
              .ffaq.imgmain {
                display: table;
                margin: 0 auto;
              }
              .ffaq.imgmain p {
                font-size: 12px;
                margin-bottom: 0;
              }
              .ffaq.imgmain img.imgresize {
                max-width: 100%;
                width: 100%;
              }`
            )
            .then((response) => {
                if (response.success) cssId = response.result;
                scrollToAnchor(currentGuide?.anchor);
            });

        if (!fullscreen) {
            serverApi.routerHook.addRoute('/deckfaqs-fullscreen', () => {
                return (
                    <AppContextProvider incomingState={stateRef.current}>
                        <FullScreenGuide
                            serverApi={serverApi}
                            onDismiss={handleDismiss}
                        />
                    </AppContextProvider>
                );
            });
        }

        return function cleanup() {
            serverApi.removeCssFromTab(
                !fullscreen ? 'QuickAccess' : 'SP',
                cssId.result
            );
            if (!fullscreen)
                serverApi.routerHook.removeRoute('/deckfaqs-fullscreen');
        };
    }, []);

    return useMemo(
        () => (
            <div
                style={{
                    flexGrow: '1',
                    background: '#fff',
                    overflow: 'auto',
                    height: '100%',
                }}
                className={state.darkMode ? 'deckfaqs_dark' : ''}
                ref={guideDiv}
            >
                {parse(currentGuide?.guideHtml ?? '', options)}
            </div>
        ),
        [currentGuide]
    );
};

const navButtonStyle = {
    height: '40px',
    width: '200px',
    minWidth: '0',
    padding: '10px 12px',
};

type FullScreenGuideProps = DefaultProps & {
    onDismiss: (updatedGuide: GuideContents) => void;
};
const FullScreenGuide = ({ serverApi, onDismiss }: FullScreenGuideProps) => {
    const { state } = useContext(AppContext);
    const guide = useRef(state.currentGuide);

    useEffect(() => {
        guide.current = state.currentGuide;
    }, [state.currentGuide]);

    useEffect(() => {
        return function cleanup() {
            guide.current && onDismiss(guide.current);
        };
    }, []);
    return (
        <div
            style={{
                display: 'flex',
                flexFlow: 'column',
                marginTop: '50px',
                flexGrow: '1',
                overflow: 'auto',
                color: '#000',
            }}
        >
            <div
                style={{
                    marginBottom: '10px',
                    marginLeft: '10px',
                    marginRight: '10px',
                    display: 'flex',
                }}
            >
                <Focusable style={{ display: 'flex' }}>
                    {Router.MainRunningApp !== undefined && (
                        <DialogButton
                            style={{ ...navButtonStyle, marginRight: '10px' }}
                            onClick={() => {
                                Router.NavigateBackOrOpenMenu();
                                setTimeout(
                                    () => Router.NavigateToRunningApp(),
                                    200
                                );
                            }}
                        >
                            Back to Game
                        </DialogButton>
                    )}
                    <DialogButton
                        style={{ ...navButtonStyle, marginRight: '10px' }}
                        onClick={() => {
                            Router.NavigateBackOrOpenMenu();
                            setTimeout(
                                () =>
                                    Router.OpenQuickAccessMenu(
                                        QuickAccessTab.Decky
                                    ),
                                200
                            );
                        }}
                    >
                        Back to DeckFAQs
                    </DialogButton>
                    {state.currentGuide!.guideToc!.length > 0 && (
                        <TocDropdown serverApi={serverApi} />
                    )}
                </Focusable>
            </div>
            <Guide fullscreen={true} serverApi={serverApi} />
        </div>
    );
};
