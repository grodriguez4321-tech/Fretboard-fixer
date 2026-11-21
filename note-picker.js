function fretPicker(onPick){
  const board=guitarNeck('Choose a string and fret',onPick);
  board.root.classList.add('position-picker');
  for(const cell of board.cells)cell.classList.add('touch-fret');
  const key=p=>p.string*25+p.fret;
  return {root:board.root,update(marked,allowed=null,showFret,otherPlaces=[]){
    const selected=new Set(marked.map(key)),available=allowed && new Set(allowed.map(key)),alternatives=new Set(otherPlaces.map(key));
    for(const cell of board.cells){
      const id=Number(cell.dataset.string)*25+Number(cell.dataset.fret);
      cell.dataset.mark=selected.has(id)?'selected':(available?.has(id)||alternatives.has(id))?'available':'';
      cell.disabled=!!available && !available.has(id);
      cell.setAttribute('aria-pressed',String(selected.has(id)));
    }
    const focus=marked[0] || allowed?.[0];
    if(focus)board.setTabStop(board.cellAt(focus.string,focus.fret));
    board.reveal(showFret);
  }};
}
