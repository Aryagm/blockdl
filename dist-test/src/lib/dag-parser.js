import graphlib from 'graphlib';
/**
 * Parses a graph into a DAG structure with unique variable names for code generation.
 * Returns ordered nodes, edge map, and validation information.
 * Uses graphlib for robust cycle detection and topological sorting.
 */
export function parseGraphToDAG(nodes, edges) {
    const errors = [];
    if (nodes.length === 0) {
        return {
            orderedNodes: [],
            edgeMap: new Map(),
            isValid: false,
            errors: ['Network must have at least one layer']
        };
    }
    // Create graphlib Graph instance
    const graph = new graphlib.Graph({ directed: true });
    // Convert nodes to a map for easy lookup
    const nodeMap = new Map();
    nodes.forEach(node => {
        nodeMap.set(node.id, node);
        graph.setNode(node.id);
    });
    // Add edges to the graph
    edges.forEach(edge => {
        graph.setEdge(edge.source, edge.target);
    });
    // Find input nodes (nodes with no incoming edges)
    const inputNodes = nodes.filter(node => {
        return graph.inEdges(node.id)?.length === 0;
    });
    // Find output nodes (nodes with no outgoing edges)
    const outputNodes = nodes.filter(node => {
        return graph.outEdges(node.id)?.length === 0;
    });
    // Validate input/output structure
    if (inputNodes.length === 0) {
        errors.push('Network must have at least one Input layer');
    }
    if (outputNodes.length === 0) {
        errors.push('Network must have at least one Output layer');
    }
    // Check for cycles using graphlib's isAcyclic function
    if (!graphlib.alg.isAcyclic(graph)) {
        errors.push('Network contains cycles - DAG structure required');
    }
    // If there are validation errors, return early
    if (errors.length > 0) {
        return {
            orderedNodes: [],
            edgeMap: new Map(),
            isValid: false,
            errors
        };
    }
    // Perform topological sort using graphlib
    const topologicalOrder = graphlib.alg.topsort(graph);
    // Generate unique variable names
    const typeCounters = new Map();
    function generateVarName(type) {
        const counter = typeCounters.get(type) || 0;
        typeCounters.set(type, counter + 1);
        if (counter === 0) {
            return type.toLowerCase();
        }
        return `${type.toLowerCase()}_${counter}`;
    }
    // Create ordered LayerObjects
    const orderedNodes = topologicalOrder.map((nodeId) => {
        const node = nodeMap.get(nodeId);
        const nodeData = node.data;
        return {
            id: node.id,
            type: nodeData.type,
            params: nodeData.params || {},
            varName: generateVarName(nodeData.type)
        };
    });
    // Build edge map for compatibility with existing code
    const edgeMap = new Map();
    nodes.forEach(node => {
        const outgoingEdges = graph.outEdges(node.id) || [];
        const targets = outgoingEdges.map((edge) => edge.w);
        edgeMap.set(node.id, targets);
    });
    return {
        orderedNodes,
        edgeMap,
        isValid: true,
        errors: []
    };
}
/**
 * Legacy function for backward compatibility - returns only ordered layers for linear paths
 */
export function getOrderedLayers(nodes, edges) {
    const result = parseGraphToDAG(nodes, edges);
    // For backward compatibility, only return ordered nodes if it's a valid linear path
    if (!result.isValid) {
        return [];
    }
    // Check if it's a linear path (each node has at most one outgoing connection)
    for (const [, targets] of result.edgeMap.entries()) {
        if (targets.length > 1) {
            return []; // Not a linear path
        }
    }
    return result.orderedNodes;
}
/**
 * Validates if the current graph structure represents a valid neural network DAG
 */
export function validateNetworkStructure(nodes, edges) {
    const result = parseGraphToDAG(nodes, edges);
    return {
        isValid: result.isValid,
        errors: result.errors
    };
}
