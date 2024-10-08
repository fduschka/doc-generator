import { insertTextSiblingAfter, getNextSibling } from './reportUtils';
import { BUILT_IN_COMMANDS, Node } from './types';

// In-place
// In case of split commands (or even split delimiters), joins all the pieces
// at the starting node
const extractVariables = (template: Node, delimiter: [string, string]) => {
  let node: Node | null = template;
  let fCmd = false;
  let openNode = null;
  let idxDelimiter = 0;
  let variables = [];

  while (node != null) {

    // Process text nodes inside `w:t` tags
    if (
      node._fTextNode &&
      node._parent &&
      !node._parent._fTextNode &&
      node._parent._tag === 'w:t'
    ) {
      if (openNode == null) openNode = node;
      const textIn = node._text;
      node._text = '';
      for (let i = 0; i < textIn.length; i++) {
        const c = textIn[i];

        // What's the current expected delimiter
        const currentDelimiter = fCmd ? delimiter[1] : delimiter[0];

        // Matches the expected delimiter character
        if (c === currentDelimiter[idxDelimiter]) {
          idxDelimiter += 1;

          // Finished matching delimiter? Then toggle `fCmd`,
          // add a new `w:t` + text node (either before or after the delimiter),
          // depending on the case
          if (idxDelimiter === currentDelimiter.length) {
            if (fCmd) {
              const variable = openNode._text.substring(currentDelimiter.length, openNode._text.length)

              variables.push(variable);
            }
            
            fCmd = !fCmd;

            const fNodesMatch = node === openNode;
            if (fCmd && openNode._text.length) {
              openNode = insertTextSiblingAfter(openNode);
              if (fNodesMatch) node = openNode;
            }
            openNode._text += currentDelimiter;
            if (!fCmd && i < textIn.length - 1) {
              openNode = insertTextSiblingAfter(openNode);
              if (fNodesMatch) node = openNode;
            }
            idxDelimiter = 0;
            if (!fCmd) openNode = node; // may switch open node to the current one

          }

          // Doesn't match the delimiter, but we had some partial match
        } else if (idxDelimiter) {
          openNode._text += currentDelimiter.slice(0, idxDelimiter);
          idxDelimiter = 0;
          if (!fCmd) openNode = node;
          openNode._text += c;

          // General case
        } else {
          openNode._text += c;
        }
      }
      // Close the text node if nothing's pending
      if (!fCmd && !idxDelimiter) openNode = null;
    }

    // // Find next node to process
    if (node._children.length) node = node._children[0];
    else {
      let fFound = false;
      while (node._parent != null) {
        const nodeParent: Node = node._parent;
        const nextSibling = getNextSibling(node);
        if (nextSibling) {
          fFound = true;
          node = nextSibling;
          break;
        }
        node = nodeParent;
      }
      if (!fFound) node = null;
    }
  }
  return variables;
};

// ==========================================
// Public API
// ==========================================
export default extractVariables;

