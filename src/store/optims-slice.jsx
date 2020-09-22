import { compose, path, propEq, find, curry, map, when, always, mergeRight, tap } from 'ramda';
import { createSlice, createAsyncThunk, AsyncThunk, Slice } from "@reduxjs/toolkit";

import { requestGetProjectOptims, requestChangeModifierSettings } from "../api";

/**
 * Async thunk for making a request to get the starting page for a project's optimizers
 *
 * @type {AsyncThunk<Promise<*>, {readonly projectId?: *}, {}>}
 */
export const getOptimsThunk = createAsyncThunk(
  "selectedOptims/getProjectOptims",
  async ({ projectId }) => {
    const body = await requestGetProjectOptims(projectId);

    return body.optims;
  }
);

export const changeModifierSettingsThunk = createAsyncThunk(
  "selectedOptims/changeModifierSettings",
  async ({ modifierId, optimId, settings }, thunk) => {
    const { project_id: projectId } = selectedOptimById(optimId, thunk.getState())
    const body = await requestChangeModifierSettings({ projectId, optimId, modifierId, settings })

    return body.optim
  }
)

/**
 * Slice for handling the selected project's optimizations state in the redux store.
 *
 * @type {Slice<{val: [], error: null, projectId: null, status: string}, {}, string>}
 */
const selectedOptimsSlice = createSlice({
  name: "selectedOptims",
  initialState: {
    val: [],
    status: "idle",
    error: null,
    projectId: null,
  },
  reducers: {},
  extraReducers: {
    [getOptimsThunk.pending]: (state, action) => {
      state.status = "loading";
      state.projectId = action.meta.arg.projectId;
    },
    [getOptimsThunk.fulfilled]: (state, action) => {
      state.status = "succeeded";
      state.val = action.payload;
      state.projectId = action.meta.arg.projectId;
    },
    [getOptimsThunk.rejected]: (state, action) => {
      state.status = "failed";
      state.error = action.error.message;
      state.projectId = action.meta.arg.projectId;
    },
    [changeModifierSettingsThunk.fulfilled]: (state, action) => {
      state.val = map(
        when(propEq('optim_id', action.payload.optim_id),
        always(action.payload)),
        state.val)
    }
  },
});

/***
 * Available actions for selectedOptims redux store
 */
export const {} = selectedOptimsSlice.actions;

/**
 * Simple selector to get the current selected optimizations state
 * including the val, status, error, and projectId
 *
 * @param state - the redux store state
 * @returns {Reducer<State> | Reducer<{val: *[], error: null, projectId: null, status: string}>}
 */
export const selectSelectedOptimsState = (state) => state.selectedOptims;
export const selectedOptimById = curry((id, state) => compose(find(propEq('optim_id', id)), path(['selectedOptims', 'val']))(state))

export default selectedOptimsSlice.reducer;