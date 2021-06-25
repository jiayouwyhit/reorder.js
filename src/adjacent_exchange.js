import { inverse_permutation } from './permutation';

// Accorging to
// E. R. Gansner, E. Koutsofios, S. C. North, and K.-P. Vo. 1993. A
// Technique for Drawing Directed Graphs. IEEE Trans. Softw. Eng. 19, 3
// (March 1993), 214-230. DOI=10.1109/32.221135
// http://dx.doi.org/10.1109/32.221135
// page 14: "[...] reduce obvious crossings after the vertices have
// been sorted, transforming a given ordering to one that is locally
// optimal with respect to transposition of adjacent vertices. It
// typically provides an additional 20-50% reduction in edge crossings.

function count_in_crossings(graph, v, w, inv) {
  const v_edges = graph.inEdges(v);
  const w_edges = graph.inEdges(w);
  let cross = 0;

  for (let iw = 0; iw < w_edges.length; iw++) {
    const p0 = inv[w_edges[iw].target.index];
    for (let iv = 0; iv < v_edges.length; iv++) {
      if (inv[v_edges[iv].target.index] > p0) {
        cross++;
      }
    }
  }
  return cross;
}

function count_out_crossings(graph, v, w, inv) {
  const v_edges = graph.outEdges(v);
  const w_edges = graph.outEdges(w);
  let cross = 0;

  for (let iw = 0; iw < w_edges.length; iw++) {
    const p0 = inv[w_edges[iw].source.index];
    for (let iv = 0; iv < v_edges.length; iv++) {
      if (inv[v_edges[iv].source.index] > p0) {
        cross++;
      }
    }
  }
  return cross;
}

function count_all_in_crossings(graph,a,b,layer){
    if(!Array.isArray(graph)){
        return count_in_crossings(graph, a, b, layer);
    }
    let sum = 0;
    for(let i = 0; i<graph.length; i++){
        sum += count_in_crossings(graph[i],a,b,layer);
    }
    return sum;
}
function count_all_out_crossings(graph,a,b,layer){
    if(!Array.isArray(graph)){
        return count_out_crossings(graph,a,b,layer);
    }
    let sum = 0;
    for(let i = 0; i<graph.length; i++){
        sum += count_out_crossings(graph[i],a,b,layer);
    }
    return sum;
}

/**
 * Optimize two layers by swapping adjacent nodes when
 * it reduces the number of crossings.
 * @param {Graph} graph - the graph these two layers belong to
 * @param {list} layer1 - the ordered list of nodes in layer 1
 * @param {list} layer2 - the ordered list of nodes in layer 2
 * @returns {list} a tuple containing the new layer1, layer2, and crossings count
 */
export function adjacent_exchange(graph, layer1, layer2) {
  layer1 = layer1.slice();
  layer2 = layer2.slice();
  const inv_layer1 = inverse_permutation(layer1);
  const inv_layer2 = inverse_permutation(layer2);
  let swapped = true;
  let improved = 0;

  while (swapped) {
    swapped = false;
    for (let i = 0; i < layer1.length - 1; i++) {
      const v = layer1[i];
      const w = layer1[i + 1];
      const c0 = count_all_out_crossings(graph, v, w, inv_layer2);
      const c1 = count_all_out_crossings(graph, w, v, inv_layer2);
      if (c0 > c1) {
        layer1[i] = w;
        layer1[i + 1] = v;
        inv_layer1[w] = i;
        inv_layer1[v] = i + 1;
        swapped = true;
        improved += c0 - c1;
      }
    }
    for (let i = 0; i < layer2.length - 1; i++) {
      const v = layer2[i];
      const w = layer2[i + 1];
      const c0 = count_all_in_crossings(graph, v, w, inv_layer1);
      const c1 = count_all_in_crossings(graph, w, v, inv_layer1);
      if (c0 > c1) {
        layer2[i] = w;
        layer2[i + 1] = v;
        inv_layer2[w] = i;
        inv_layer2[v] = i + 1;
        swapped = true;
        improved += c0 - c1;
      }
    }
  }

  return [layer1, layer2, improved];
}
