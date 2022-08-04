import {Component, Inject, OnDestroy, OnInit, ViewEncapsulation, ViewChild, ElementRef} from '@angular/core';
import {Location} from '@angular/common';
import {CdkDragDrop, CdkDragEnter, CdkDragExit, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {MatMenuTrigger} from '@angular/material/menu';
import {FormBuilder, FormGroup, FormArray, Validators, Form} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {combineLatest, map, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Observable} from 'rxjs';

import { TranslocoService } from '@ngneat/transloco';
import {fuseAnimations} from '@fuse/animations';


import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {ConfirmDialogComponent} from 'app/shared/components/confirm-dialog.component';
import {EntityDatasource} from 'app/shared/entity-datasource';
import {SelectionCard} from 'app/shared/models/selectionCard';
import {Selection} from 'app/shared/models/selection';
import * as _ from 'lodash';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {SourceSetting} from 'app/shared/models/sourceSetting';
import {FuseConfigService} from '@fuse/services/config';
import {FuseMediaWatcherService} from '@fuse/services/media-watcher';

interface SelectionNode {
    id: string;
    value: string;
    title: string;
    children?: SelectionNode[];
    nested: number;
}

@Component({
    selector: 'segmentation',
    templateUrl: './segmentation.component.html'
})
export class SegmentationComponent implements OnInit, OnDestroy {
    public selectionForm: FormGroup;
    public errors = [];

    public selectionNodes = [];
    public savedSelectionCards = [];
    public hasSelectionNodes = false;
    public openSelectionCards = false;
    public lanes = [];
    public selectionCards = [];
    public currentLaneId = 0;
    public currentCardId = 0;
    public newCardId = 1;
    public removingSelection = false;
    public openedSelection = false;
    public getSelectionName = false;
    public currentSelection: Selection;
    public finalCount = 0;
    public finalLane = 0;
    public finalAction = 'segment';
    public lists = [];
    public layouts = [];
    public selectionSegment = '';
    public selectionLimit = '';
    public selectionListName = '';
    public exportPassword = '';
    public canSegment = false;
    public canCreate = false;
    public canUpdate = false;
    public canExport = false;
    public contextMenuPosition = {x: '0px', y: '0px'};
    public scheme;
    public theme;
    public layout;

    nodeTreeControl = new NestedTreeControl<SelectionNode>(node => node.children);
    nodeDataSource = new MatTreeNestedDataSource<SelectionNode>();

    cardTreeControl = new NestedTreeControl<SelectionNode>(node => node.children);
    cardDataSource = new MatTreeNestedDataSource<SelectionNode>();

    private _unsubscribeAll: Subject<any>;

    @ViewChild('selectionTrigger') selectionContextMenu: MatMenuTrigger;
    @ViewChild('cardTrigger') cardContextMenu: MatMenuTrigger;


    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private abandonDialogService: AbandonDialogService,
        private _translocoService: TranslocoService,
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private router: Router,
        private location: Location,
        private _fuseConfigService: FuseConfigService,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) {
        this._translocoService.setActiveLang('en');
        this._unsubscribeAll = new Subject();
    }

    isHeader = (_: number, node: SelectionNode) => (!!node.children && node.children.length > 0) ||
        (node.nested === 1);

    ngOnInit(): void {
        this.httpService.getEntity('selection-nodes', '')
            .subscribe(result => {
                this.selectionNodes = result;
                this.hasSelectionNodes = true;
                this.nodeDataSource.data = this.selectionNodes;
            }, (errors) => {
                this.errors = errors;
            });

        this.getSavedSelectionCards();

        this.httpService.getEntity('selection-lists', '')
            .subscribe(result => {
                this.lists = result;
            }, (errors) => {
                this.errors = errors;
            });

        this.httpService.getEntity('selection-layouts', '')
            .subscribe(result => {
                this.layouts = result;
            }, (errors) => {
                this.errors = errors;
            });

        this.selectionForm = this._formBuilder.group({
            'id': [''],
            'action': ['segment'],
            'name': ['', Validators.required],
            'description': [''],
            'listId': [''],
            'layoutId': [''],
        });

        combineLatest([
            this._fuseConfigService.config$,
            this._fuseMediaWatcherService.onMediaQueryChange$(['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'])
        ]).pipe(
            takeUntil(this._unsubscribeAll),
            map(([config, mql]) => {

                const options = {
                    scheme: config.scheme,
                    theme: config.theme,
                    layout: config.layout
                };

                // If the scheme is set to 'auto'...
                if (config.scheme === 'auto') {
                    // Decide the scheme using the media query
                    options.scheme = mql.breakpoints['(prefers-color-scheme: dark)'] ? 'dark' : 'light';
                }

                return options;
            })
        ).subscribe((options) => {
            this.scheme = options.scheme;
            this.theme = options.theme;
            this.layout = options.layout;
        });

        this.resetSelections();
    }

    getFullHeight(): string {
        let fullHeight = 'div-full-height-130';
        if (this.layout === 'modern') {
            fullHeight = 'div-full-height-180';
        }
        if (this.layout === 'enterprise') {
            fullHeight = 'div-full-height-290';
        }
        return fullHeight;
    }

    getSelectionTree(): string {
        let selectTree = 'selection-tree-320';
        if (!this.getSelectionName) {
            if (this.layout === 'modern') {
                selectTree = 'selection-tree-360';
            }
            if (this.layout === 'enterprise') {
                selectTree = 'selection-tree-440';
            }
        } else {
            selectTree = 'selection-tree-360';
            if (this.layout === 'modern') {
                selectTree = 'selection-tree-400';
            }
            if (this.layout === 'enterprise') {
                selectTree = 'selection-tree-480';
            }

        }
        return selectTree;
    }

    getLaneClass(laneId): string {
        let laneClass;
        if (this.scheme === 'light') {
            if (this.theme=== 'theme-teal'){
                laneClass = 'bg-blue-100';
                if (laneId === this.currentLaneId) {
                    laneClass = 'bg-blue-200';
                }
            } else {
                laneClass = 'bg-teal-100';
                if (laneId === this.currentLaneId) {
                    laneClass = 'bg-teal-200';
                }
            }
        } else {
            if (this.theme=== 'theme-teal') {
                laneClass = 'bg-blue-800';
                if (laneId === this.currentLaneId) {
                    laneClass = 'bg-blue-600';
                }
            } else {
                laneClass = 'bg-teal-700';
                if (laneId === this.currentLaneId) {
                    laneClass = 'bg-teal-500';
                }
            }
        }
        return laneClass;
    }

    getLaneHeaderClass(): string {
        let laneClass;
        if (this.scheme === 'light') {
            if (this.theme=== 'theme-teal') {
                laneClass = 'bg-blue-400';
            } else {
                laneClass = 'bg-teal-400';
            }
        } else {
            if (this.theme=== 'theme-teal') {
                laneClass = 'bg-blue-900';
            } else {
                laneClass = 'bg-teal-900';
            }
        }
        return laneClass;
    }

    getCardClass(cardId, cardInvert): string {
        let cardClass='';
        if (this.scheme === 'light') {
            if (this.currentCardId === cardId) {
                cardClass = 'bg-yellow-100';
            } else {
                if (cardInvert) {
                    cardClass = 'bg-purple-100';
                }
            }
        } else {
            cardClass='bg-accent-800';
            if (this.currentCardId === cardId) {
                cardClass = 'bg-yellow-700';
            } else {
                if (cardInvert) {
                    cardClass = 'bg-accent-600';
                }
            }
        }
        return cardClass;
    }

    getCardHeaderClass(cardId, cardInvert): string {
        let cardClass='';
        if (this.scheme === 'light') {
            if (this.currentCardId === cardId) {
                cardClass = 'bg-blue-300';
                if (cardInvert) {
                    cardClass = 'bg-red-300';
                }
            } else {
                cardClass = 'bg-blue-200';
                if (cardInvert) {
                    cardClass = 'bg-red-200';
                }
            }
        } else {
            if (this.currentCardId === cardId) {
                cardClass = 'bg-blue-800';
                if (cardInvert) {
                    cardClass = 'bg-red-800';
                }
            } else {
                cardClass = 'bg-blue-700';
                if (cardInvert) {
                    cardClass = 'bg-red-700';
                }
            }
        }
        return cardClass;
    }

    getFinalLaneClass(): string {
        let laneClass;
        if (this.scheme === 'light') {
            laneClass = 'bg-primary-100';
        } else {
            laneClass = 'bg-primary-700';
        }
        return laneClass;
    }

    getFinalLaneHeaderClass(): string {
        let laneClass;
        if (this.scheme === 'light') {
            laneClass = 'bg-primary-500';
        } else {
            laneClass = 'bg-primary-600';
        }
        return laneClass;
    }

    getFinalCardClass(): string {
        let cardClass;
        if (this.scheme === 'light') {
            cardClass = 'bg-primary-300';
        } else {
            cardClass = 'bg-primary-900';
        }
        return cardClass;
    }

    getFinalCardHeaderClass(): string {
        let cardClass;
        if (this.scheme === 'light') {
            cardClass = 'bg-primary-300';
        } else {
            cardClass = 'bg-primary-800';
        }
        return cardClass;
    }

    getSavedSelectionCards(): void {
        this.httpService.getEntity('saved-selection-cards', '')
            .subscribe(result => {
                this.savedSelectionCards = result;
                this.updateSavedSelectionTree();
            }, (errors) => {
                this.errors = errors;
            });
    }

    updateSavedSelectionTree(): void {
        const savedCardsTree = [];
        let existingCard;
        this.savedSelectionCards.forEach((selectionCard, index) => {
            existingCard = this.getSavedSelectionCard(selectionCard.selectionCardId);
            if (existingCard === null) {
                selectionCard.value = selectionCard.title;
                savedCardsTree.push(selectionCard);
            }
        });
        const fullSavedSelectionCards = [{
            id: 'savedSelectionCards',
            parentSelectionNodeId: 0, value: 'Prebuilt Selections', title: 'Prebuilt Selections',
            children: savedCardsTree, nested: 1
        }];
        this.cardDataSource.data = fullSavedSelectionCards;
        if (this.openSelectionCards) {
            this.cardTreeControl.expand(fullSavedSelectionCards[0]);
        }
    }


    getLaneIds(): any {
        const laneIds = [];
        laneIds.push('remove-item');
        this.lanes.forEach(lane => {
            laneIds.push('lane-' + lane.id);
        });

        return laneIds;
    }

    getNextLaneId(): any {
        let laneId = 1;
        this.lanes.forEach(lane => {
            if (lane.id > laneId) {
                laneId = lane.id;
            }
        });

        return laneId + 1;
    }

    getLane(laneId): any {
        let currentLane = null;
        this.lanes.forEach(lane => {
            if (lane.id === laneId) {
                currentLane = lane;
            }
        });
        return currentLane;
    }

    getSavedSelectionCard(selectionCardId): any {
        let currentCard = null;
        this.selectionCards.forEach(card => {
            if (card.selectionCardId === selectionCardId) {
                currentCard = card;
            }
        });
        return currentCard;

    }

    reSequenceLanes(sequence = 1000): any {
        this.lanes.sort((a, b) => (a.sequence < b.sequence ? -1 : 1));
        this.lanes.forEach((lane, index) => {
            if (index + 1 <= sequence) {
                lane.sequence = index + 1;
            } else {
                lane.sequence = index + 2;
            }
        });
        this.finalLane = this.lanes.length;
    }

    reSequenceCards(lane, sequence = 1000): any {
        lane.selections.sort((a, b) => (a.sequence < b.sequence ? -1 : 1));
        lane.selections.forEach((card, index) => {
            if (index + 1 <= sequence) {
                card.sequence = index + 1;
            } else {
                card.sequence = index + 2;
            }
        });
    }


    getCardIds(): any {
        const cardIds = [];
        cardIds.push('remove-item');
        cardIds.push('master-nodes');
        this.selectionCards.forEach(card => {
            cardIds.push('card-' + card.id);
        });

        return cardIds;
    }

    noReturnPredicate(): boolean {
        return false;
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    clearErrors(): void {
        this.errors = [];
    }

    onCancel(): void {
        this.selectionForm.reset();
        this.selectionForm.markAsPristine();
        this.resetSelections();
    }

    onBack(): void {
        this.location.back();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.selectionForm.dirty) {
            return this.abandonDialogService.showDialog();
        } else {
            return true;
        }
    }

    populateForm(): void {
        if (this.currentSelection.id) {
            this.selectionForm.controls['id'].reset('');
            this.selectionForm.controls['name'].reset('');
            this.selectionForm.controls['description'].reset('');

            this.selectionForm.controls['id'].setValue(this.currentSelection.id);
            this.selectionForm.controls['name'].setValue(this.currentSelection.name);
            this.selectionForm.controls['description'].setValue(this.currentSelection.description);
        }
    }

    resetSelections(openSelection = false): void {
        this.lanes = [];
        this.selectionCards = [];
        this.newCardId = 1;
        this.errors = [];
        this.updateSavedSelectionTree();
        if (!openSelection) {
            this.openedSelection = false;
            this.getSelectionName = false;

            // Start with two lanes
            const lane1 = {
                id: 1,
                sequence: 1,
                selections: [],
                count: 0,
            };
            this.lanes.push(lane1);

            const lane2 = {
                id: 2,
                sequence: 2,
                selections: [],
                count: 0,
            };
            this.lanes.push(lane2);

            // Add a card to lane 1
            const card = new SelectionCard({id: this.newCardId, title: '', lane: lane1.id, sequence: 1});
            lane1.selections.push(card);
            this.selectionCards.push(card);
            this.currentCardId = this.newCardId;
            this.currentLaneId = 1;
            this.newCardId += 1;
        }
        this.finalLane = this.lanes.length;
        this.getCount();
    }

    doGetSelectionName(): void {
        this.getSelectionName = true;
    }

    doOpenSelection(): void {
        const dialogRef = this.dialog.open(SegmentationOpenSegmentDialogComponent, {
            minWidth: '70%',
            data: {}
        });

        dialogRef.afterClosed().subscribe(openResult => {
            if (openResult) {
                this.currentSelection = openResult;
                this.openedSelection = true;
                this.getSelectionName = true;
                this.resetSelections(true);
                this.populateForm();
                this.httpService.getEntity('selection-cards', this.currentSelection.id)
                    .subscribe(result => {
                        this.selectionCards = result;
                        let openLane;
                        this.selectionCards.forEach(selectionCard => {
                            if (selectionCard.id > this.newCardId) {
                                this.newCardId = selectionCard.id + 1;
                            }
                            openLane = this.getLane(selectionCard.lane);
                            if (openLane === null) {
                                openLane = {
                                    id: selectionCard.lane,
                                    sequence: selectionCard.lane,
                                    selections: [],
                                    count: 0,
                                };
                                this.lanes.push(openLane);
                            }
                            openLane.selections.push(selectionCard);
                        });
                        // add a final empty lane and re-sequence everything
                        this.addNewLane(null);
                        this.lanes.forEach(lane => {
                            this.reSequenceCards(lane);
                        });
                    }, (errors) => {
                        this.errors = errors;
                    });

            }
        });
    }

    doSaveSelection(saveAs: boolean): void {
        const id = this.selectionForm.controls['id'];
        const name = this.selectionForm.controls['name'];
        const description = this.selectionForm.controls['description'];
        const listId = this.selectionForm.controls['listId'];
        const layoutId = this.selectionForm.controls['layoutId'];

        const selections = [];
        let selectionCard;
        this.selectionCards.forEach((card, index) => {
            selectionCard = {
                cardId: card.id, selectionCardId: card.selectionCardId, title: card.title,
                selections: card.selections, invert: card.invert, lane: card.lane, sequence: card.sequence
            };
            selections.push(selectionCard);
        });

        const data = {
            id: id.value, name: name.value, description: description.value, listId: listId.value,
            layoutId: layoutId.value, segment: this.selectionSegment, limit: this.selectionLimit,
            cards: selections
        };
        if (saveAs) {
            data['id'] = '';
            data['saveAs'] = 1;
        } else {
            const dataId = this.selectionForm.controls['id'].value;
            data['id'] = dataId;
        }

        this.errors = [];
        this.httpService.saveEntity('selection', data)
            .subscribe((saveResult) => {
                const newId = saveResult['id'];
                const newName = saveResult['name'];
                const newCardIds = saveResult['cardIds'];
                this.selectionForm.controls['id'].setValue(newId);
                this.selectionForm.controls['name'].setValue(newName);
                newCardIds.forEach((newCardId) => {
                    this.selectionCards.forEach((card, index) => {
                        if (newCardId.id === card.id) {
                            card.selectionCardId = newCardId.selectionCardId;
                        }
                    });
                });

            }, (errors) => {
                this.errors = errors;
            });
    }

    selectLane(event, laneId): void {
        this.currentLaneId = laneId;
    }

    addLane(event, laneId): void {
        this.addNewLane(laneId);
        event.stopPropagation();
    }

    addNewLane(laneId): void {
        let currentSequence = 1000;
        if (laneId !== null) {
            const currentLane = this.getLane(laneId);
            if (currentLane) {
                currentSequence = currentLane.sequence;
            }
        }
        this.reSequenceLanes(currentSequence);
        const newLane = {
            id: this.getNextLaneId(),
            sequence: currentSequence + 1,
            selections: [],
            count: 0,
        };

        this.lanes.push(newLane);
        this.reSequenceLanes();
        this.currentLaneId = newLane.id;
    }

    removeLane(event, laneId): void {
        if (this.lanes.length > 1) {
            this.lanes.forEach((lane, index) => {
                if (lane.id === laneId) {
                    this.lanes.splice(index, 1);
                }
            });
            this.reSequenceLanes();
            this.lanes.forEach((lane, index) => {
                this.currentLaneId = lane.id;
            });
        }
        event.stopPropagation();
    }

    laneDrop(event: CdkDragDrop<any>): void {
        const sourceContainer = event.previousContainer;
        const targetContainer = event.container;
        const sourceElement = event.item;

        const newIndex = event.currentIndex + 1;

        let targetLane;
        if (targetContainer.data && targetContainer.data.laneId) {
            targetLane = this.lanes.find(x => x.id === targetContainer.data.laneId);
        }
        let card;
        if (sourceElement.data && sourceElement.data.card) {
            card = sourceElement.data.card;
        }
        if (sourceContainer.data && sourceContainer.data.laneId) {
            // drag and drop between lanes
            const sourceLane = this.lanes.find(x => x.id === sourceContainer.data.laneId);
            const previousIndex = event.previousIndex + 1;

            if (targetLane && sourceLane) {
                // if the target is not the same as the source then remove from the target
                // and add to the source
                if (targetContainer.data.laneId !== sourceContainer.data.laneId) {
                    sourceLane.selections.forEach((laneSelection, selectionIndex) => {
                        if (laneSelection.id === card.id) {
                            sourceLane.selections.splice(selectionIndex, 1);
                        }
                    });
                    this.reSequenceCards(sourceLane);
                    card.lane = targetLane.id;
                    card.sequence = newIndex;
                    targetLane.selections.forEach((laneSelection, selectionIndex) => {
                        // move all cards with a higher sequence up 1
                        if (laneSelection.sequence >= newIndex) {
                            laneSelection.sequence += 1;
                        }
                    });
                    targetLane.selections.splice(newIndex - 1, 0, card);
                } else {
                    // the card is being dropped on the current lane so the id will
                    // match one of the existing selection cards. Change it's sequence to the new position
                    targetLane.selections.forEach((laneSelection, selectionIndex) => {
                        if (laneSelection.id === card.id) {
                            laneSelection.sequence = newIndex;
                        } else {
                            // move the other cards either up or down depending on where they are
                            // compare to where the card was originally
                            if (previousIndex > newIndex && laneSelection.sequence >= newIndex) {
                                laneSelection.sequence += 1;
                            }
                            if (previousIndex < newIndex && laneSelection.sequence <= newIndex) {
                                laneSelection.sequence -= 1;
                            }
                        }
                    });

                }
                this.reSequenceCards(targetLane);
            }
        } else {
            // drag and drop from the card tree
            const newCard = new SelectionCard({
                id: this.newCardId,
                title: card.title,
                selectionCardId: card.selectionCardId,
                lane: targetLane.id,
                sequence: newIndex,
                selections: _.cloneDeep(card.selections),
                invert: card.invert
            });
            this.selectionCards.push(newCard);
            this.newCardId += 1;
            targetLane.selections.forEach((laneSelection, selectionIndex) => {
                // move all cards with a higher sequence up 1
                if (laneSelection.sequence >= newIndex) {
                    laneSelection.sequence += 1;
                }
            });
            targetLane.selections.splice(newIndex - 1, 0, newCard);
            this.openSelectionCards = true;
            this.updateSavedSelectionTree();
        }
        this.getCount();
    }

    addCard($event, laneId): void {
        const currentLane = this.getLane(laneId);
        if (currentLane) {
            this.currentCardId = this.newCardId;
            const sequence = currentLane.selections.length + 1;
            const card = new SelectionCard({
                id: this.newCardId,
                title: '',
                lane: currentLane.id,
                sequence: sequence
            });
            currentLane.selections.push(card);
            this.reSequenceCards(currentLane);
            this.selectionCards.push(card);
            this.newCardId += 1;
            this.getCount();
        }
    }

    selectCard(event, cardId, laneId): void {
        this.currentCardId = cardId;
        this.currentLaneId = laneId;
    }

    removeCard(event, cardId): void {
        const currentCard = this.selectionCards.find(x => x.id === cardId);
        if (currentCard) {
            const currentLane = this.getLane(currentCard.lane);
            currentLane.selections.forEach((card, index) => {
                if (card.id === cardId) {
                    currentLane.selections.splice(index, 1);
                }
            });
            this.reSequenceCards(currentLane);
            let newCurrentCard = false;
            this.selectionCards.forEach((card, index) => {
                if (card.id === cardId) {
                    this.selectionCards.splice(index, 1);
                } else {
                    if (!newCurrentCard) {
                        this.currentCardId = card.id;
                        newCurrentCard = true;
                    }
                }
            });
            this.updateSavedSelectionTree();
            this.getCount();
        }
    }

    saveCard(event, cardId, saveAs): void {
        const currentCard = this.selectionCards.find(x => x.id === cardId);
        if (currentCard && currentCard.title.length > 0) {
            let selectionCardId = currentCard.selectionCardId;
            if (saveAs) {
                // unset the selectionCardId
                selectionCardId = '';
            }
            const title = currentCard.title;
            const selections = currentCard.selections;
            const invert = currentCard.invert;

            const data = {
                cardId: cardId, selectionCardId: selectionCardId, title: title, selections: selections, invert: invert
            };
            if (saveAs) {
                data['saveAs'] = 1;
            } else {
                data['saveAs'] = 0;
            }

            this.errors = [];
            this.httpService.saveEntity('selection-card', data)
                .subscribe((saveResult) => {
                    const saveCurrentCard = this.selectionCards.find(x => x.id === saveResult['cardId']);
                    if (saveCurrentCard) {
                        saveCurrentCard.selectionCardId = saveResult['selectionCardId'];
                        saveCurrentCard.title = saveResult['title'];
                        this.getSavedSelectionCards();
                    }
                }, (errors) => {
                    this.errors = errors;
                });

        }
    }

    cardTitle($event, cardId): void {
        const element = $event.currentTarget;
        const title = element.value;
        const currentCard = this.selectionCards.find(x => x.id === this.currentCardId);
        if (currentCard) {
            currentCard.title = title;
        }
    }

    invertCard(event, cardId): void {
        this.currentCardId = cardId;
        const currentCard = this.selectionCards.find(x => x.id === cardId);
        if (currentCard) {
            currentCard.invert = currentCard.invert === 1 ? 0 : 1;
            this.getCount();
        }
    }

    nodeAddToCard(event, node): void {
        const currentCard = this.selectionCards.find(x => x.id === this.currentCardId);
        if (currentCard) {
            let nodeExists = false;
            let valueExists = false;
            let entryId = 1;
            if (node.entry) {
                this.selectionCards.forEach((selectionCard, cardIndex) => {
                    selectionCard.selections.forEach((cardSelection, selectionIndex) => {
                        // get the next entryId
                        if (
                            cardSelection.entry &&
                            cardSelection.parentSelectionNodeId === node.parentSelectionNodeId &&
                            cardSelection.entryId >= entryId
                        ) {
                            entryId = cardSelection.entryId + 1;
                        }

                    });
                });
            }
            currentCard.selections.forEach((cardSelection, index) => {
                if (node.select || node.list) {
                    if (cardSelection.parentSelectionNodeId === node.parentSelectionNodeId) {
                        nodeExists = true;
                        cardSelection.values.forEach((value) => {
                            if (value.id === node.id) {
                                valueExists = true;
                            }
                        });
                        if (!valueExists) {
                            cardSelection.values.push({id: node.id, sequence: node.sequence, value: node.value});
                            cardSelection.values.sort((a, b) => a.sequence > b.sequence ? 1 : -1);
                        }
                    }
                }
            });
            if (!nodeExists) {
                const selection = _.cloneDeep(node);

                if (node.select || node.list) {
                    selection.values = [{id: node.id, sequence: node.sequence, value: node.value}];
                }
                if (node.entry) {
                    selection.entryId = entryId;
                    selection.value = '';
                }
                currentCard.selections.push(selection);
                currentCard.selections.sort((a, b) => a.id.localeCompare(b.id));
            }
            this.getCount();
        }
    }

    cardAddToLane(event, card): void {
        const currentLane = this.getLane(this.currentLaneId);
        if (currentLane) {
            this.currentCardId = this.newCardId;
            const sequence = currentLane.selections.length + 1;
            const newCard = new SelectionCard({
                id: this.newCardId,
                title: card.title,
                selectionCardId: card.selectionCardId,
                lane: currentLane.id,
                sequence: sequence,
                selections: _.cloneDeep(card.selections),
                invert: card.invert
            });
            currentLane.selections.push(newCard);
            this.reSequenceCards(currentLane);
            this.selectionCards.push(newCard);
            this.newCardId += 1;
            this.openSelectionCards = true;
            this.updateSavedSelectionTree();
            this.getCount();
        }
    }

    segmentActionChange(item): void {
        this.finalAction = item.value;
    }

    removeEntered(event: CdkDragEnter<any>): void {
        this.removingSelection = true;
    }
    removeExited(event: CdkDragExit<any>): void {
        this.removingSelection = false;
    }

    removeDrop(event: CdkDragDrop<any>): void {
        this.removingSelection = false;
        const sourceContainer = event.previousContainer;
        const targetContainer = event.container;
        const sourceElement = event.item;
        const selection = sourceElement.data.selection;

        // check if removing a selection from a card
        let sourceCard;
        if (selection && sourceContainer.data && sourceContainer.data.cardId) {
            sourceCard = this.selectionCards.find(x => x.id === sourceContainer.data.cardId);
            if (sourceCard) {
                sourceCard.selections.forEach((cardSelection, selectionIndex) => {
                    if (selection.select || selection.list) {
                        if (cardSelection.id === selection.id) {
                            sourceCard.selections.splice(selectionIndex, 1);
                        }
                    }
                    if (selection.entry) {
                        if (
                            cardSelection.id === selection.id &&
                            cardSelection.entryId &&
                            cardSelection.entryId === selection.entryId
                        ) {
                            sourceCard.selections.splice(selectionIndex, 1);
                        }
                    }
                });
                this.getCount();
            }
        }

        // check if removing a card from a lane
        let card;
        if (sourceElement.data && sourceElement.data.card) {
            card = sourceElement.data.card;
            if (sourceContainer.data && sourceContainer.data.laneId) {
                this.removeCard(event, card.id);
            }
        }
    }

    cardDrop(event: CdkDragDrop<any>): void {
        const sourceContainer = event.previousContainer;
        const targetContainer = event.container;
        const sourceElement = event.item;
        const node = sourceElement.data.node;
        const selection = sourceElement.data.selection;

        let entryId = 1;
        if (selection) {
            // there is a source selection so there is no need to check for entry and get the next entryId
        } else {
            if (node.entry) {
                // get the next entryId
                this.selectionCards.forEach((selectionCard, cardIndex) => {
                    selectionCard.selections.forEach((cardSelection, selectionIndex) => {
                        if (
                            cardSelection.entry &&
                            cardSelection.parentSelectionNodeId === node.parentSelectionNodeId &&
                            cardSelection.entryId >= entryId
                        ) {
                            entryId = cardSelection.entryId + 1;
                        }

                    });
                });
            }
        }

        let sourceCard;
        let targetCard;
        if (sourceContainer.data && sourceContainer.data.cardId) {
            sourceCard = this.selectionCards.find(x => x.id === sourceContainer.data.cardId);
        }
        if (targetContainer.data && targetContainer.data.cardId) {
            targetCard = this.selectionCards.find(x => x.id === targetContainer.data.cardId);
        }

        // if dragging and dropping on the same card then do nothing
        if (!targetCard || !sourceCard ||
            (targetCard && sourceCard && targetCard.id !== sourceCard.id)
        ) {
            if (targetCard) {
                let nodeExists = false;
                let valueExists = false;
                targetCard.selections.forEach((cardSelection, selectionIndex) => {
                    if (selection) {
                        // drag and drop between card
                        if (selection.select || selection.list) {
                            if (cardSelection.parentSelectionNodeId === selection.parentSelectionNodeId) {
                                nodeExists = true;
                                selection.values.forEach((value) => {
                                    valueExists = false;
                                    cardSelection.values.forEach((cardValue) => {
                                        if (value.id === cardValue.id) {
                                            valueExists = true;
                                        }
                                    });
                                    if (!valueExists) {
                                        cardSelection.values.push(value);
                                        cardSelection.values.sort((a, b) => a.sequence > b.sequence ? 1 : -1);
                                    }
                                });
                            }
                        }
                    } else {
                        if (node.select || node.list) {
                            // drag and drop from the node tree
                            if (cardSelection.parentSelectionNodeId === node.parentSelectionNodeId) {
                                nodeExists = true;
                                valueExists = false;
                                cardSelection.values.forEach((cardValue) => {
                                    if (node.id === cardValue.id) {
                                        valueExists = true;
                                    }
                                });
                                if (!valueExists) {
                                    cardSelection.values.push(node);
                                    cardSelection.values.sort((a, b) => a.sequence > b.sequence ? 1 : -1);
                                }
                            }
                        }
                    }
                });
                if (!nodeExists) {
                    if (selection) {
                        if (selection.select || selection.list) {
                            targetCard.selections.push(selection);
                        }
                        if (selection.entry) {
                            targetCard.selections.push(selection);
                        }
                    } else {
                        const newSelection = _.cloneDeep(node);
                        if (node.select || node.list) {
                            newSelection.values = [{id: node.id, sequence: node.sequence, value: node.value}];
                        }
                        if (node.entry) {
                            newSelection.entryId = entryId;
                            newSelection.value = '';
                        }
                        targetCard.selections.push(newSelection);
                    }
                    targetCard.selections.sort((a, b) => a.id.localeCompare(b.id));
                }

            }
            if (sourceCard) {
                sourceCard.selections.forEach((cardSelection, selectionIndex) => {
                    if (selection.select || selection.list) {
                        if (cardSelection.id === selection.id) {
                            sourceCard.selections.splice(selectionIndex, 1);
                        }
                    }
                    if (selection.entry) {
                        if (
                            cardSelection.id === selection.id &&
                            cardSelection.entryId &&
                            cardSelection.entryId === selection.entryId
                        ) {
                            sourceCard.selections.splice(selectionIndex, 1);
                        }
                    }
                });
            }
            this.getCount();
        }
    }

    removeSelectionValue($event, cardId, parentSelectionNodeId, value): void {
        const currentCard = this.selectionCards.find(x => x.id === cardId);
        if (currentCard) {
            currentCard.selections.forEach((cardSelection, selectionIndex) => {
                if (cardSelection.select || cardSelection.list) {
                    if (cardSelection.parentSelectionNodeId === parentSelectionNodeId) {
                        cardSelection.values.forEach((cardValue, valueIndex) => {
                            if (value.id === cardValue.id) {
                                cardSelection.values.splice(valueIndex, 1);
                            }
                        });
                        // if there are no values then remove the node from the card
                        if (cardSelection.values.length === 0) {
                            currentCard.selections.splice(selectionIndex, 1);
                        }
                    }
                }
            });
            this.getCount();
        }
    }

    entryValue(event, cardId, parentSelectionNodeId, entryId): void {
        const currentCard = this.selectionCards.find(x => x.id === cardId);
        if (currentCard) {
            currentCard.selections.forEach((cardSelection, selectionIndex) => {
                if (cardSelection.parentSelectionNodeId === parentSelectionNodeId &&
                    cardSelection.entryId &&
                    cardSelection.entryId === entryId
                ) {
                    cardSelection.value = event.target.value;
                }
            });
            this.getCount();
        }
    }

    onSelectionContextMenu(event: MouseEvent, node): void {
        event.preventDefault();
        this.contextMenuPosition.x = event.clientX + 'px';
        this.contextMenuPosition.y = event.clientY + 'px';
        this.selectionContextMenu.menuData = {'node': node};
        this.selectionContextMenu.menu.focusFirstItem('mouse');
        this.selectionContextMenu.openMenu();
    }

    onCardContextMenu(event: MouseEvent, card): void {
        event.preventDefault();
        this.contextMenuPosition.x = event.clientX + 'px';
        this.contextMenuPosition.y = event.clientY + 'px';
        this.cardContextMenu.menuData = {'card': card};
        this.cardContextMenu.menu.focusFirstItem('mouse');
        this.cardContextMenu.openMenu();
    }

    onContextMenuRemoveSavedCard(card): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '33%',
            width: '300px',
            data: {
                confirmMessage: 'Are you sure you want to delete the prebuilt selection: ' + card.title + ' ?',
                informationMessage: 'Note: A prebuilt selection will not be deleted if it is in use'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.deleteEntity('saved-selection-card', card.selectionCardId)
                    .subscribe((deleteResult) => {
                        this.getSavedSelectionCards();
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });
    }

    public listSelect(item): void {
        this.selectionForm.controls['listId'].setValue(item.value);
        this.getCount();
        this.checkCanSegment();
        this.canUpdate = true;
    }

    public segmentChange(event): void {
        const target = event.currentTarget;
        this.selectionSegment = target.value;
        this.checkCanSegment();
    }

    public limitChange(event): void {
        const target = event.currentTarget;
        this.selectionLimit = target.value;
    }

    public passwordChange(event): void {
        const target = event.currentTarget;
        this.exportPassword = target.value;
        this.checkCanExport();
    }

    protected checkCanSegment(): void {
        this.canSegment = false;
        const listId = this.selectionForm.controls['listId'];
        if (this.selectionSegment && listId.value && this.finalCount > 0) {
            this.canSegment = true;
        }
    }

    protected checkCanExport(): void {
        this.canExport = false;
        const layoutId = this.selectionForm.controls['layoutId'];
        if (this.exportPassword && layoutId.value && this.finalCount > 0) {
            this.canExport = true;
        }
    }

    public layoutSelect(item): void {
        this.selectionForm.controls['layoutId'].setValue(item.value);
        this.checkCanCreate();
        this.checkCanExport();
    }

    public layoutDeselect(item): void {
        this.selectionForm.controls['layoutId'].reset('');
        this.getCount();
        this.checkCanCreate();
    }

    public listNameChange(event): void {
        const target = event.currentTarget;
        this.selectionListName = target.value;
        this.checkCanCreate();
    }

    protected checkCanCreate(): void {
        this.canCreate = false;
        const layoutId = this.selectionForm.controls['layoutId'];
        if (this.selectionListName && layoutId.value && this.finalCount > 0) {
            this.canCreate = true;
        }
    }

    doSegment(): void {
        let cards = [];
        let selectionCard;
        this.selectionCards.forEach((card) => {
            selectionCard = {
                cardId: card.id, selectionCardId: card.selectionCardId, title: card.title,
                selections: card.selections, invert: card.invert, lane: card.lane, sequence: card.sequence
            };
            cards.push(selectionCard);
        });
        const listId = this.selectionForm.controls['listId'];
        let listIdValue = '';
        if (listId.value) {
            listIdValue = listId.value;
        }

        this.errors = [];
        this.httpService.saveEntity('selection-segment', {
            cards: cards, listId: listIdValue, segment: this.selectionSegment, limit: this.selectionLimit,
        })
            .subscribe((saveResult) => {
                this._snackBar.open('List segmentation scheduled', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
            }, (errors) => {
                this.errors = errors;
            });
    }

    listUpdate(): void {
        let cards = [];
        let selectionCard;
        this.selectionCards.forEach((card) => {
            selectionCard = {
                cardId: card.id, selectionCardId: card.selectionCardId, title: card.title,
                selections: card.selections, invert: card.invert, lane: card.lane, sequence: card.sequence
            };
            cards.push(selectionCard);
        });
        const listId = this.selectionForm.controls['listId'];
        let listIdValue = '';
        if (listId.value) {
            listIdValue = listId.value;
        }

        this.errors = [];
        this.httpService.saveEntity('selection-list-update', {
            cards: cards, listId: listIdValue,
        })
            .subscribe((saveResult) => {
                this._snackBar.open('List update scheduled', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
            }, (errors) => {
                this.errors = errors;
            });
    }

    listCreate(): void {
        let cards = [];
        let selectionCard;
        this.selectionCards.forEach((card) => {
            selectionCard = {
                cardId: card.id, selectionCardId: card.selectionCardId, title: card.title,
                selections: card.selections, invert: card.invert, lane: card.lane, sequence: card.sequence
            };
            cards.push(selectionCard);
        });
        const layoutId = this.selectionForm.controls['layoutId'];
        let layoutIdValue = '';
        if (layoutId.value) {
            layoutIdValue = layoutId.value;
        }

        this.errors = [];
        this.httpService.saveEntity('selection-list-create', {
            cards: cards, layoutId: layoutIdValue, listName: this.selectionListName
        })
            .subscribe((saveResult) => {
                this._snackBar.open('List creation scheduled', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
            }, (errors) => {
                this.errors = errors;
            });
    }

    listExport(): void {
        let cards = [];
        let selectionCard;
        this.selectionCards.forEach((card) => {
            selectionCard = {
                cardId: card.id, selectionCardId: card.selectionCardId, title: card.title,
                selections: card.selections, invert: card.invert, lane: card.lane, sequence: card.sequence
            };
            cards.push(selectionCard);
        });
        const layoutId = this.selectionForm.controls['layoutId'];
        let layoutIdValue = '';
        if (layoutId.value) {
            layoutIdValue = layoutId.value;
        }

        this.errors = [];
        this.httpService.saveEntity('selection-list-export', {
            cards: cards, password: this.exportPassword, layoutId: layoutIdValue,
        })
            .subscribe((saveResult) => {
                this._snackBar.open('List export scheduled', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
            }, (errors) => {
                this.errors = errors;
            });
    }

    getCount(): void {
        const selections = [];
        let selectionCard;
        this.selectionCards.forEach((card, index) => {
            selectionCard = {
                cardId: card.id, selectionCardId: card.selectionCardId, title: card.title,
                selections: card.selections, invert: card.invert, lane: card.lane, sequence: card.sequence
            };
            selections.push(selectionCard);
        });

        const listId = '';
        const data = {
            cards: selections, listId: listId
        };

        this.errors = [];
        this.httpService.saveEntity('selection-count', data)
            .subscribe((saveResult) => {
                this.lanes.forEach((lane) => {
                    lane.count = 0;
                });

                const cards = saveResult;
                cards.forEach((cardCount) => {
                    this.finalCount = cardCount.finalCount;
                    this.selectionCards.forEach((card) => {
                        if (card.id === cardCount.id && JSON.stringify(card.selections) === JSON.stringify(cardCount.selections)) {
                            card.count = cardCount.count;
                        }
                    });
                    this.lanes.forEach((lane) => {
                        if (lane.sequence === cardCount.lane) {
                            lane.count = cardCount.laneCount;
                        }
                    });
                });

            }, (errors) => {
                this.errors = errors;
            });

    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }

}


@Component({
    selector: 'segmentation-open-segment-dialog',
    templateUrl: 'segmentation-open-segment.dialog.html',
    styleUrls: ['segmentation-open-segment.dialog.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class SegmentationOpenSegmentDialogComponent implements OnInit, OnDestroy {

    public openSelectionForm: FormGroup;
    displayedColumns = ['name', 'description'];
    selectionDataSource: EntityDatasource | null;
    public paginatedDataSource;
    selections: any;
    selectedSelection: Selection;
    selectedRow: {};
    selectedIndex: number = -1;
    private _unsubscribeAll: Subject<any>;
    private touchStart = 0;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    constructor(
        public dialogRef: MatDialogRef<SegmentationOpenSegmentDialogComponent>,
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this._unsubscribeAll = new Subject();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngOnInit(): void {
        this.selectionDataSource = new EntityDatasource(
            this.httpService,
            'selections',
            ''
        );

        this.selectionDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selections => {
                if (selections instanceof Array) {
                    this.selections = selections;
                    if (selections.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<SourceSetting>(selections);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: Selection, filter: string) => this.selectionsFilterPredicate(data, filter);
                        this.filterElement.nativeElement.focus();
                    }
                }

            });

        this.openSelectionForm = this._formBuilder.group({}
        );
    }

    onConfirm(): void {
        this.dialogRef.close(this.selectedSelection);
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    selectionsFilterPredicate(data: Selection, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.name.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onSelect(row, index): void {
        if (this.touchStart === 0) {
            this.touchStart = new Date().getTime();
        } else {
            if (new Date().getTime() - this.touchStart < 400) {
                this.touchStart = 0;
                this.onConfirm();
            } else {
                this.touchStart = new Date().getTime();
            }
        }
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedSelection = new Selection(row);
    }

    onArrowDown(): void {
        const pageEnd = ((this.paginator.pageIndex + 1) * this.paginator.pageSize) - 1;
        const sortedData = this.paginatedDataSource.sortData(this.paginatedDataSource.filteredData, this.paginatedDataSource.sort);
        if (this.selectedIndex < pageEnd && sortedData[this.selectedIndex + 1]) {
            this.selectedRow = sortedData[this.selectedIndex + 1];
            this.selectedIndex = this.selectedIndex + 1;
        }
    }

    onArrowUp(): void {
        const pageStart = (this.paginator.pageIndex * this.paginator.pageSize);
        const sortedData = this.paginatedDataSource.sortData(this.paginatedDataSource.filteredData, this.paginatedDataSource.sort);
        if (this.selectedIndex > pageStart && sortedData[this.selectedIndex - 1]) {
            this.selectedRow = sortedData[this.selectedIndex - 1];
            this.selectedIndex = this.selectedIndex - 1;
        }
    }

    public filterLayouts = (value: string) => {
        this.paginatedDataSource.filter = value.trim().toLocaleLowerCase();
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }
}
