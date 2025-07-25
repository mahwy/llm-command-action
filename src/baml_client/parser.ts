/*************************************************************************************************

Welcome to Baml! To use this generated code, please run one of the following:

$ npm install @boundaryml/baml
$ yarn add @boundaryml/baml
$ pnpm add @boundaryml/baml

*************************************************************************************************/

// This file was generated by BAML: please do not edit it. Instead, edit the
// BAML files and re-generate this code using: baml-cli generate
// You can install baml-cli with:
//  $ npm install @boundaryml/baml
//
/* eslint-disable */
// tslint:disable
// @ts-nocheck
// biome-ignore format: autogenerated code

import type {
  BamlRuntime,
  BamlCtxManager,
  ClientRegistry,
  Image,
  Audio,
  Collector
} from '@boundaryml/baml'
import { toBamlError } from '@boundaryml/baml'
import type { Checked, Check } from './types.js'
import type { partial_types } from './partial_types.js'
import type * as types from './types.js'
import type {
  Command,
  CommandInstruction,
  CommandOuputInPullRequest,
  CommandPlan,
  CommandReferenceFile,
  Comment,
  File,
  LoadCommandOutputIntoContext,
  LoadFileIntoContext,
  PlanResult,
  PullRequest,
  PullRequestCommentForPlan,
  PullRequestFileForPlan,
  PullRequestForPlan
} from './types.js'
import type TypeBuilder from './type_builder.js'

export class LlmResponseParser {
  constructor(
    private runtime: BamlRuntime,
    private ctxManager: BamlCtxManager
  ) {}

  ExecuteCommandInPullRequest(
    llmResponse: string,
    __baml_options__?: {
      tb?: TypeBuilder
      clientRegistry?: ClientRegistry
      env?: Record<string, string | undefined>
    }
  ): types.CommandOuputInPullRequest {
    try {
      const rawEnv = __baml_options__?.env
        ? { ...process.env, ...__baml_options__.env }
        : { ...process.env }
      const env: Record<string, string> = Object.fromEntries(
        Object.entries(rawEnv).filter(([_, value]) => value !== undefined) as [
          string,
          string
        ][]
      )
      return this.runtime.parseLlmResponse(
        'ExecuteCommandInPullRequest',
        llmResponse,
        false,
        this.ctxManager.cloneContext(),
        __baml_options__?.tb?.__tb(),
        __baml_options__?.clientRegistry,
        env
      ) as types.CommandOuputInPullRequest
    } catch (error) {
      throw toBamlError(error)
    }
  }

  Plan(
    llmResponse: string,
    __baml_options__?: {
      tb?: TypeBuilder
      clientRegistry?: ClientRegistry
      env?: Record<string, string | undefined>
    }
  ): types.PlanResult {
    try {
      const rawEnv = __baml_options__?.env
        ? { ...process.env, ...__baml_options__.env }
        : { ...process.env }
      const env: Record<string, string> = Object.fromEntries(
        Object.entries(rawEnv).filter(([_, value]) => value !== undefined) as [
          string,
          string
        ][]
      )
      return this.runtime.parseLlmResponse(
        'Plan',
        llmResponse,
        false,
        this.ctxManager.cloneContext(),
        __baml_options__?.tb?.__tb(),
        __baml_options__?.clientRegistry,
        env
      ) as types.PlanResult
    } catch (error) {
      throw toBamlError(error)
    }
  }
}

export class LlmStreamParser {
  constructor(
    private runtime: BamlRuntime,
    private ctxManager: BamlCtxManager
  ) {}

  ExecuteCommandInPullRequest(
    llmResponse: string,
    __baml_options__?: {
      tb?: TypeBuilder
      clientRegistry?: ClientRegistry
      env?: Record<string, string | undefined>
    }
  ): partial_types.CommandOuputInPullRequest {
    try {
      const rawEnv = __baml_options__?.env
        ? { ...process.env, ...__baml_options__.env }
        : { ...process.env }
      const env: Record<string, string> = Object.fromEntries(
        Object.entries(rawEnv).filter(([_, value]) => value !== undefined) as [
          string,
          string
        ][]
      )
      return this.runtime.parseLlmResponse(
        'ExecuteCommandInPullRequest',
        llmResponse,
        true,
        this.ctxManager.cloneContext(),
        __baml_options__?.tb?.__tb(),
        __baml_options__?.clientRegistry,
        env
      ) as partial_types.CommandOuputInPullRequest
    } catch (error) {
      throw toBamlError(error)
    }
  }

  Plan(
    llmResponse: string,
    __baml_options__?: {
      tb?: TypeBuilder
      clientRegistry?: ClientRegistry
      env?: Record<string, string | undefined>
    }
  ): partial_types.PlanResult {
    try {
      const rawEnv = __baml_options__?.env
        ? { ...process.env, ...__baml_options__.env }
        : { ...process.env }
      const env: Record<string, string> = Object.fromEntries(
        Object.entries(rawEnv).filter(([_, value]) => value !== undefined) as [
          string,
          string
        ][]
      )
      return this.runtime.parseLlmResponse(
        'Plan',
        llmResponse,
        true,
        this.ctxManager.cloneContext(),
        __baml_options__?.tb?.__tb(),
        __baml_options__?.clientRegistry,
        env
      ) as partial_types.PlanResult
    } catch (error) {
      throw toBamlError(error)
    }
  }
}
