import * as vscode from 'vscode';
import { JitionEditorProvider } from './JItion';
import { PawDrawEditorProvider } from './pawDrawEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(JitionEditorProvider.register(context));
	context.subscriptions.push(PawDrawEditorProvider.register(context));
}
